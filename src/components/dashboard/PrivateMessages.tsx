import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { MessageCircle, Send, ArrowLeft, Users } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import type { AppState, Employee } from '../../App';

interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface PrivateMessagesProps {
  appState: AppState;
}

export function PrivateMessages({ appState }: PrivateMessagesProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [appState.office]);

  useEffect(() => {
    scrollToBottom();
    if (selectedUser) {
      markAsRead(selectedUser.id);
    }
  }, [messages, selectedUser]);

  const loadMessages = async () => {
    if (!appState.office) return;
    
    try {
      const data = await getData(appState.office.id, 'direct-messages');
      setMessages(data.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!appState.office || !appState.currentEmployee || !selectedUser || !newMessage.trim()) return;

    try {
      const message: DirectMessage = {
        id: crypto.randomUUID(),
        senderId: appState.currentEmployee.id,
        recipientId: selectedUser.id,
        message: newMessage,
        timestamp: new Date().toISOString(),
        read: false
      };

      const updated = [...messages, message];
      await updateData(appState.office.id, 'direct-messages', updated);

      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const markAsRead = async (userId: string) => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      const updated = messages.map(msg =>
        msg.senderId === userId && msg.recipientId === appState.currentEmployee!.id
          ? { ...msg, read: true }
          : msg
      );

      await updateData(appState.office.id, 'direct-messages', updated);
      setMessages(updated);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const getConversationWith = (userId: string) => {
    return messages.filter(
      msg =>
        (msg.senderId === appState.currentEmployee?.id && msg.recipientId === userId) ||
        (msg.senderId === userId && msg.recipientId === appState.currentEmployee?.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getUnreadCount = (userId: string) => {
    return messages.filter(
      msg =>
        msg.senderId === userId &&
        msg.recipientId === appState.currentEmployee?.id &&
        !msg.read
    ).length;
  };

  const getLastMessage = (userId: string) => {
    const conversation = getConversationWith(userId);
    return conversation[conversation.length - 1];
  };

  // Get all users I've messaged or who messaged me
  const getConversationList = () => {
    const userIds = new Set<string>();
    messages.forEach(msg => {
      if (msg.senderId === appState.currentEmployee?.id) {
        userIds.add(msg.recipientId);
      } else if (msg.recipientId === appState.currentEmployee?.id) {
        userIds.add(msg.senderId);
      }
    });

    return appState.employees
      .filter(emp => emp.id !== appState.currentEmployee?.id && userIds.has(emp.id))
      .sort((a, b) => {
        const lastA = getLastMessage(a.id);
        const lastB = getLastMessage(b.id);
        if (!lastA) return 1;
        if (!lastB) return -1;
        return new Date(lastB.timestamp).getTime() - new Date(lastA.timestamp).getTime();
      });
  };

  const getAvailableUsers = () => {
    return appState.employees.filter(emp => emp.id !== appState.currentEmployee?.id);
  };

  const getRoleColor = (roleName: string) => {
    const role = appState.roles.find(r => r.name === roleName);
    return role?.color || '#000';
  };

  const conversationList = getConversationList();
  const availableUsers = getAvailableUsers();

  if (selectedUser) {
    const conversation = getConversationWith(selectedUser.id);

    return (
      <div className="p-6 h-[calc(100vh-100px)] flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Button
            onClick={() => setSelectedUser(null)}
            variant="outline"
            size="icon"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-black">{selectedUser.name}</h2>
            <Badge
              variant="outline"
              style={{
                borderColor: getRoleColor(selectedUser.role),
                color: getRoleColor(selectedUser.role)
              }}
              className="text-xs"
            >
              {selectedUser.role}
            </Badge>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden border-2 border-black flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {conversation.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              conversation.map(msg => {
                const isSent = msg.senderId === appState.currentEmployee?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                        isSent
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="break-words">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isSent ? 'text-black/70' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t-2 border-black">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-black mb-1 flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          Private Messages
        </h1>
        <p className="text-gray-600">Direct messages with your colleagues</p>
      </div>

      {/* Active Conversations */}
      {conversationList.length > 0 && (
        <div>
          <h2 className="text-black mb-3">Conversations</h2>
          <div className="space-y-2">
            {conversationList.map(user => {
              const unreadCount = getUnreadCount(user.id);
              const lastMsg = getLastMessage(user.id);

              return (
                <Card
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                    unreadCount > 0 ? 'border-2 border-yellow-400 bg-yellow-50' : 'border-2 border-black'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-black truncate">{user.name}</h4>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: getRoleColor(user.role),
                              color: getRoleColor(user.role)
                            }}
                            className="text-xs"
                          >
                            {user.role}
                          </Badge>
                        </div>
                        {lastMsg && (
                          <p className="text-sm text-gray-600 truncate">
                            {lastMsg.senderId === appState.currentEmployee?.id ? 'You: ' : ''}
                            {lastMsg.message}
                          </p>
                        )}
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Users */}
      <div>
        <h2 className="text-black mb-3">Start a Conversation</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableUsers.map(user => (
            <Card
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="p-4 cursor-pointer border-2 border-black hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-black">{user.name}</h4>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: getRoleColor(user.role),
                      color: getRoleColor(user.role)
                    }}
                    className="text-xs"
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
