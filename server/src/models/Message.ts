import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database';

export interface MessageAttributes {
  id?: number;
  sender_id: number;
  receiver_id?: number;
  room_id?: string;
  content: string;
  message_type?: 'text' | 'image' | 'file';
  is_read?: boolean;
  read_at?: Date;
}

export class Message extends Model<MessageAttributes> implements MessageAttributes {
  public id!: number;
  public sender_id!: number;
  public receiver_id?: number;
  public room_id?: string;
  public content!: string;
  public message_type!: 'text' | 'image' | 'file';
  public is_read!: boolean;
  public read_at?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    sender_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    receiver_id: {
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'file'),
      defaultValue: 'text',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'messages',
    modelName: 'Message',
    indexes: [
      {
        fields: ['sender_id', 'receiver_id'],
      },
      {
        fields: ['room_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default Message;
