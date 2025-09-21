import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  IndianRupee, 
  Info,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserMessage {
  id: string;
  message_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const UserMessages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadMessages();
      loadUnreadCount();
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_messages' as any, {
        user_uuid: user.id,
        limit_count: 50
      });

      if (!error && data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_unread_message_count' as any, {
        user_uuid: user.id
      });

      if (!error && data !== null) {
        setUnreadCount(data);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('mark_message_as_read' as any, {
        message_id: messageId,
        user_uuid: user.id
      });

      if (!error && data) {
        // Update local state
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, is_read: true } : msg
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'membership_purchased':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'membership_upgraded':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'membership_expired':
        return <XCircle className="w-5 h-5 text-orange-500" />;
      case 'withdrawal_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'withdrawal_rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'withdrawal_processed':
        return <IndianRupee className="w-5 h-5 text-blue-500" />;
      case 'question_report_resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'question_report_rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMessageBadgeVariant = (messageType: string) => {
    switch (messageType) {
      case 'membership_purchased':
        return 'default';
      case 'membership_upgraded':
        return 'secondary';
      case 'membership_expired':
        return 'destructive';
      case 'withdrawal_approved':
        return 'default';
      case 'withdrawal_rejected':
        return 'destructive';
      case 'withdrawal_processed':
        return 'secondary';
      case 'question_report_resolved':
        return 'default';
      case 'question_report_rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatMessageType = (messageType: string) => {
    return messageType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="w-4 h-4 mr-2" />
          Messages
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} unread</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Your membership, withdrawal, and question report status updates
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages</h3>
              <p className="text-gray-600">You don't have any messages yet.</p>
            </div>
          ) : (
            messages.map((message) => (
              <Card 
                key={message.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !message.is_read ? 'border-blue-200 bg-blue-50' : ''
                }`}
                onClick={() => !message.is_read && markAsRead(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getMessageIcon(message.message_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {message.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getMessageBadgeVariant(message.message_type)}>
                            {formatMessageType(message.message_type)}
                          </Badge>
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">
                        {message.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserMessages;
