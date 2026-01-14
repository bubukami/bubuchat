import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database';

export interface ConversationAttributes {
  id?: number;
  user_id: number;
  other_user_id?: number;
  room_id?: string;
  last_message?: string;
  last_message_at?: Date;
  unread_count?: number;
}

export class Conversation extends Model<ConversationAttributes> implements ConversationAttributes {
  public id!: number;
  public user_id!: number;
  public other_user_id?: number;
  public room_id?: string;
  public last_message?: string;
  public last_message_at?: Date;
  public unread_count!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Conversation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    other_user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    room_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    last_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unread_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'conversations',
    modelName: 'Conversation',
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['user_id', 'other_user_id'],
      },
      {
        fields: ['room_id'],
      },
    ],
  }
);

export default Conversation;
