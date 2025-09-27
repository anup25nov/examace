import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink,
  Clock,
  Users,
  Eye,
  Crown,
  Link,
  QrCode,
  Download,
  Trash2
} from 'lucide-react';
import { testSharingService, TestShareData } from '@/lib/testSharingService';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/contexts/MembershipContext';

interface TestSharingProps {
  testId: string;
  examId: string;
  sectionId: string;
  testType: string;
  testName: string;
  isPremium: boolean;
  onClose?: () => void;
}

export const TestSharing: React.FC<TestSharingProps> = ({
  testId,
  examId,
  sectionId,
  testType,
  testName,
  isPremium,
  onClose
}) => {
  const { user } = useAuth();
  const { hasAccess } = useMembership();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareCode, setShareCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [userShares, setUserShares] = useState<TestShareData[]>([]);
  const [stats, setStats] = useState({
    totalShares: 0,
    activeShares: 0,
    totalViews: 0,
    popularTests: [] as Array<{ testName: string; shareCount: number }>
  });

  useEffect(() => {
    if (user) {
      loadUserShares();
      loadStats();
    }
  }, [user]);

  const loadUserShares = async () => {
    if (!user) return;

    try {
      const { data, error } = await testSharingService.getUserSharedTests(user.id);
      if (error) {
        setError(error);
      } else {
        setUserShares(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shared tests');
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const statsData = await testSharingService.getShareStatistics(user.id);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load share statistics:', err);
    }
  };

  const createShare = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await testSharingService.createTestShare(
        testId,
        examId,
        sectionId,
        testType,
        testName,
        isPremium,
        user.id
      );

      if (result.success) {
        setShareUrl(result.shareUrl || '');
        setShareCode(result.shareCode || '');
        await loadUserShares();
        await loadStats();
      } else {
        setError(result.error || 'Failed to create share');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create share');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const revokeShare = async (shareCode: string) => {
    if (!user) return;

    try {
      const result = await testSharingService.revokeTestShare(shareCode, user.id);
      if (result.success) {
        await loadUserShares();
        await loadStats();
      } else {
        setError(result.error || 'Failed to revoke share');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to revoke share');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getShareUrl = (shareCode: string) => {
    return `${window.location.origin}/shared-test/${shareCode}`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Test Sharing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        {/* Current Test Share */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Share This Test</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{testName}</h4>
              {isPremium && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {testType.toUpperCase()} • {examId.toUpperCase()}
            </p>

            {!shareUrl ? (
              <Button
                onClick={createShare}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating Share...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={() => copyToClipboard(shareUrl)}
                    variant="outline"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(shareUrl, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Link
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(shareCode)}
                    variant="outline"
                    size="sm"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalShares}</div>
            <div className="text-sm text-blue-700">Total Shares</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.activeShares}</div>
            <div className="text-sm text-green-700">Active</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.totalViews}</div>
            <div className="text-sm text-purple-700">Total Views</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.popularTests.length}</div>
            <div className="text-sm text-orange-700">Popular Tests</div>
          </div>
        </div>

        {/* User's Shared Tests */}
        {userShares.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Shared Tests</h3>
            <div className="space-y-3">
              {userShares.map((share) => (
                <Card key={(share as any).id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{share.testName}</h4>
                        {share.isPremium && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Premium
                          </Badge>
                        )}
                        <Badge 
                          variant={isExpired(share.expiresAt) ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {isExpired(share.expiresAt) ? 'Expired' : 'Active'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          <span>Code: {share.shareCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Expires: {formatDate(share.expiresAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>Type: {share.testType.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => copyToClipboard(getShareUrl(share.shareCode))}
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        <Button
                          onClick={() => window.open(getShareUrl(share.shareCode), '_blank')}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                        <Button
                          onClick={() => revokeShare(share.shareCode)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Popular Tests */}
        {stats.popularTests.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Popular Shared Tests</h3>
            <div className="space-y-2">
              {stats.popularTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{test.testName}</span>
                  <Badge variant="outline">
                    {test.shareCount} shares
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestSharing;
