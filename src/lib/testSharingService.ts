import { supabase } from '@/integrations/supabase/client';
import { TestShare, TestShareAccess } from '@/types/database';

export interface TestShareData {
  testId: string;
  examId: string;
  sectionId: string;
  testType: string;
  testName: string;
  isPremium: boolean;
  shareUrl: string;
  shareCode: string;
  expiresAt: string;
  createdBy: string;
  createdAt: string;
}

export interface ShareResult {
  success: boolean;
  shareUrl?: string;
  shareCode?: string;
  error?: string;
}

export interface ShareAccessResult {
  success: boolean;
  testData?: any;
  error?: string;
  requiresMembership?: boolean;
}

export class TestSharingService {
  private static instance: TestSharingService;

  public static getInstance(): TestSharingService {
    if (!TestSharingService.instance) {
      TestSharingService.instance = new TestSharingService();
    }
    return TestSharingService.instance;
  }

  /**
   * Create a shareable link for a test
   */
  async createTestShare(
    testId: string,
    examId: string,
    sectionId: string,
    testType: string,
    testName: string,
    isPremium: boolean,
    userId: string
  ): Promise<ShareResult> {
    try {
      console.log(`🔗 Creating test share for: ${testId}`);

      // Generate unique share code
      const shareCode = this.generateShareCode();
      
      // Set expiration (7 days from now)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Create share record in database
      const { data: shareData, error: insertError } = await supabase
        .from('test_shares' as any)
        .insert({
          test_id: testId,
          exam_id: examId,
          section_id: sectionId,
          test_type: testType,
          test_name: testName,
          is_premium: isPremium,
          share_code: shareCode,
          expires_at: expiresAt,
          created_by: userId
        } as any)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating test share:', insertError);
        return {
          success: false,
          error: 'Failed to create share link'
        };
      }

      // Generate share URL
      const shareUrl = `${window.location.origin}/shared-test/${shareCode}`;

      console.log(`✅ Test share created: ${shareCode}`);
      return {
        success: true,
        shareUrl,
        shareCode
      };

    } catch (error: any) {
      console.error('Error creating test share:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Access a shared test
   */
  async accessSharedTest(shareCode: string, userId?: string): Promise<ShareAccessResult> {
    try {
      console.log(`🔍 Accessing shared test: ${shareCode}`);

      // Get share data
      const { data: shareData, error: fetchError } = await supabase
        .from('test_shares' as any)
        .select('*')
        .eq('share_code', shareCode)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fetchError || !shareData) {
        return {
          success: false,
          error: 'Share link not found or expired'
        };
      }

      // Check if user has access to premium content
      if ((shareData as any).is_premium && userId) {
        const hasAccess = await this.checkUserMembership(userId);
        if (!hasAccess) {
          return {
            success: false,
            error: 'This test requires a premium membership',
            requiresMembership: true
          };
        }
      }

      // Get test data
      const testData = await this.getTestData(shareData);
      if (!testData) {
        return {
          success: false,
          error: 'Test data not found'
        };
      }

      // Log access
      await this.logTestAccess(shareCode, userId);

      console.log(`✅ Shared test accessed: ${shareCode}`);
      return {
        success: true,
        testData
      };

    } catch (error: any) {
      console.error('Error accessing shared test:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get user's shared tests
   */
  async getUserSharedTests(userId: string): Promise<{ data: TestShareData[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('test_shares' as any)
        .select('*')
        .eq('created_by', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: 'Failed to fetch shared tests' };
      }

      return { data: (data as any) || [], error: null };

    } catch (error: any) {
      console.error('Error fetching user shared tests:', error);
      return { data: [], error: 'Internal server error' };
    }
  }

  /**
   * Revoke a shared test
   */
  async revokeTestShare(shareCode: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('test_shares' as any)
        .update({ is_active: false })
        .eq('share_code', shareCode)
        .eq('created_by', userId);

      if (error) {
        return { success: false, error: 'Failed to revoke share' };
      }

      console.log(`✅ Test share revoked: ${shareCode}`);
      return { success: true };

    } catch (error: any) {
      console.error('Error revoking test share:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get share statistics
   */
  async getShareStatistics(userId: string): Promise<{
    totalShares: number;
    activeShares: number;
    totalViews: number;
    popularTests: Array<{ testName: string; shareCount: number }>;
  }> {
    try {
      // Get user's shares
      const { data: userShares, error: sharesError } = await supabase
        .from('test_shares' as any)
        .select('*')
        .eq('created_by', userId);

      if (sharesError) {
        throw new Error('Failed to fetch share statistics');
      }

      const totalShares = userShares?.length || 0;
      const activeShares = userShares?.filter(share => 
        (share as any).is_active && new Date((share as any).expires_at) > new Date()
      ).length || 0;

      // Get total views
      const { data: views, error: viewsError } = await supabase
        .from('test_share_access' as any)
        .select('share_code')
        .in('share_code', userShares?.map(s => (s as any).share_code) || []);

      const totalViews = views?.length || 0;

      // Get popular tests
      const popularTests = userShares?.reduce((acc, share) => {
        const existing = acc.find(item => item.testName === (share as any).test_name);
        if (existing) {
          existing.shareCount++;
        } else {
          acc.push({ testName: (share as any).test_name, shareCount: 1 });
        }
        return acc;
      }, [] as Array<{ testName: string; shareCount: number }>) || [];

      return {
        totalShares,
        activeShares,
        totalViews,
        popularTests: popularTests.sort((a, b) => b.shareCount - a.shareCount).slice(0, 5)
      };

    } catch (error: any) {
      console.error('Error fetching share statistics:', error);
      return {
        totalShares: 0,
        activeShares: 0,
        totalViews: 0,
        popularTests: []
      };
    }
  }

  // Private helper methods

  private generateShareCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async checkUserMembership(userId: string): Promise<boolean> {
    try {
      const { data: membership, error } = await supabase
        .from('user_memberships')
        .select('status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();

      return !error && !!membership;
    } catch (error) {
      return false;
    }
  }

  private async getTestData(shareData: any): Promise<any> {
    try {
      // This would fetch the actual test data based on the share data
      // Implementation depends on your test data structure
      return {
        testId: shareData.test_id,
        examId: shareData.exam_id,
        sectionId: shareData.section_id,
        testType: shareData.test_type,
        testName: shareData.test_name,
        isPremium: shareData.is_premium,
        shareCode: shareData.share_code
      };
    } catch (error) {
      console.error('Error getting test data:', error);
      return null;
    }
  }

  private async logTestAccess(shareCode: string, userId?: string): Promise<void> {
    try {
      await supabase
        .from('test_share_access' as any)
        .insert({
          share_code: shareCode,
          user_id: userId,
          accessed_at: new Date().toISOString(),
          ip_address: 'unknown' // Would need to get from request
        });
    } catch (error) {
      console.error('Error logging test access:', error);
    }
  }
}

export const testSharingService = TestSharingService.getInstance();
