import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { MessageSquare, Send, Paperclip, BarChart3, Users, AlertCircle, Plus } from 'lucide-react';
import { Label } from '../ui/label';
import { FileViewer } from '../ui/FileViewer';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import type { AppState } from '../../App';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  attachmentName?: string;
  attachmentUrl?: string;
  isPoll?: boolean;
  pollOptions?: { option: string; votes: string[] }[];
}

interface EmployeeChatProps {
  appState: AppState;
}

export function EmployeeChat({ appState }: EmployeeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ name: string; url: string; type?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [appState.office]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!appState.office) return;
    
    try {
      const data = await getData(appState.office.id, 'chat-messages');
      setMessages(data.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!appState.office || !appState.currentEmployee || !newMessage.trim()) return;

    try {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: appState.currentEmployee.id,
        senderName: appState.currentEmployee.name,
        senderRole: appState.currentEmployee.role,
        message: newMessage,
        timestamp: new Date().toISOString()
      };

      const updated = [...messages, message];
      await updateData(appState.office.id, 'chat-messages', updated);

      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !appState.office || !appState.currentEmployee) return;

    // In a real app, upload to storage
    // For now, simulate with base64
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const message: ChatMessage = {
          id: crypto.randomUUID(),
          senderId: appState.currentEmployee!.id,
          senderName: appState.currentEmployee!.name,
          senderRole: appState.currentEmployee!.role,
          message: `Shared a file: ${file.name}`,
          timestamp: new Date().toISOString(),
          attachmentName: file.name,
          attachmentUrl: reader.result as string
        };

        const updated = [...messages, message];
        await updateData(appState.office!.id, 'chat-messages', updated);

        toast.success('File shared');
        loadMessages();
      } catch (error) {
        console.error('Error sharing file:', error);
        toast.error('Failed to share file');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePoll = async () => {
    if (!appState.office || !appState.currentEmployee || !pollQuestion || pollOptions.some(o => !o.trim())) {
      toast.error('Please fill in all poll fields');
      return;
    }

    try {
      const pollMessage: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: appState.currentEmployee.id,
        senderName: appState.currentEmployee.name,
        senderRole: appState.currentEmployee.role,
        message: pollQuestion,
        timestamp: new Date().toISOString(),
        isPoll: true,
        pollOptions: pollOptions.filter(o => o.trim()).map(option => ({
          option,
          votes: []
        }))
      };

      const updated = [...messages, pollMessage];
      await updateData(appState.office.id, 'chat-messages', updated);

      toast.success('Poll created');
      setPollDialogOpen(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      loadMessages();
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    }
  };

  const handleVotePoll = async (messageId: string, optionIndex: number) => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message || !message.isPoll || !message.pollOptions) return;

      // Remove previous vote if exists
      message.pollOptions.forEach(opt => {
        opt.votes = opt.votes.filter(v => v !== appState.currentEmployee!.id);
      });

      // Add new vote
      message.pollOptions[optionIndex].votes.push(appState.currentEmployee.id);

      const updated = messages.map(m => m.id === messageId ? message : m);
      await updateData(appState.office.id, 'chat-messages', updated);

      loadMessages();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const getRoleColor = (roleName: string) => {
    const role = appState.roles.find(r => r.name === roleName);
    return role?.color || '#000';
  };

  return (
    <div className="p-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-black mb-1 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Team Chat
            </h1>
            <p className="text-gray-600">Work-related discussions and questions</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setPollDialogOpen(true)}
              variant="outline"
              className="border-2 border-black"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Create Poll
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-2 border-black"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Attach File
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 overflow-hidden border-2 border-black flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-black mb-2">No messages yet</h3>
              <p className="text-gray-600">Start the conversation!</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-black">{msg.senderName}</span>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: getRoleColor(msg.senderRole),
                          color: getRoleColor(msg.senderRole)
                        }}
                        className="text-xs"
                      >
                        {msg.senderRole}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {msg.isPoll && msg.pollOptions ? (
                      <Card className="p-4 border-2 border-blue-500 bg-blue-50 mt-2">
                        <div className="flex items-start gap-2 mb-3">
                          <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-black">{msg.message}</p>
                        </div>
                        <div className="space-y-2">
                          {msg.pollOptions.map((option, idx) => {
                            const totalVotes = msg.pollOptions?.reduce((sum, opt) => sum + opt.votes.length, 0) || 0;
                            const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                            const hasVoted = option.votes.includes(appState.currentEmployee?.id || '');

                            return (
                              <Button
                                key={idx}
                                onClick={() => handleVotePoll(msg.id, idx)}
                                variant="outline"
                                className={`w-full justify-start ${hasVoted ? 'border-blue-500 bg-blue-100' : ''}`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{option.option}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      {option.votes.length} ({percentage.toFixed(0)}%)
                                    </span>
                                  </div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </Card>
                    ) : (
                      <>
                        <p className="text-gray-700">{msg.message}</p>
                        {msg.attachmentName && (
                          <Card
                            className="p-3 border border-gray-300 mt-2 inline-block cursor-pointer hover:bg-gray-50"
                            onClick={() => {
                              setViewingFile({
                                name: msg.attachmentName!,
                                url: msg.attachmentUrl!
                              });
                              setFileViewerOpen(true);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-700">{msg.attachmentName}</span>
                              <span className="text-xs text-blue-600">Click to view</span>
                            </div>
                          </Card>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
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
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <AlertCircle className="w-3 h-3" />
            <span>Please keep all conversations work-related and professional</span>
          </div>
        </div>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileAttachment}
        className="hidden"
      />

      {/* Poll Dialog */}
      <Dialog open={pollDialogOpen} onOpenChange={setPollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Poll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-700 mb-1.5 block">Poll Question</Label>
              <Input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="What would you like to ask?"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-700 mb-1.5 block">Options</Label>
              <div className="space-y-2">
                {pollOptions.map((option, idx) => (
                  <Input
                    key={idx}
                    value={option}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[idx] = e.target.value;
                      setPollOptions(updated);
                    }}
                    placeholder={`Option ${idx + 1}`}
                  />
                ))}
              </div>
              <Button
                onClick={() => setPollOptions([...pollOptions, ''])}
                variant="outline"
                size="sm"
                className="mt-2 w-full"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Option
              </Button>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setPollDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePoll}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Create Poll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
