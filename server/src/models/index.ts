import User from './User';
import Message from './Message';
import Conversation from './Conversation';

User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

User.hasMany(Conversation, { foreignKey: 'user_id', as: 'conversations' });
Conversation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Conversation.belongsTo(User, { foreignKey: 'other_user_id', as: 'otherUser' });

export { User, Message, Conversation };
