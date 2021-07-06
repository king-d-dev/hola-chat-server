import mongoose from 'mongoose';
import { User } from './user';

interface MessageAttr {
  text: string;
  sender: mongoose.ObjectId;
  recipient: mongoose.ObjectId;
  sentAt: Date;
  deliveredAt?: Date;
}

export interface MessageDocument extends mongoose.Document, MessageAttr {}

interface MessageModel extends mongoose.Model<MessageDocument> {
  build: (attr: MessageAttr) => MessageDocument;
}

const MessageSchema = new mongoose.Schema<MessageDocument, MessageModel>(
  {
    text: { type: String, required: true },
    sender: { type: String, required: true, ref: User },
    recipient: { type: String, required: true, ref: User },
    sentAt: { type: Date, required: true },
    deliveredAt: { type: Date, required: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id;
        delete ret.__v;
        delete ret._id;
      },
    },
  }
);

MessageSchema.statics.build = (attr: MessageAttr) => new Message(attr);
const Message = mongoose.model<MessageDocument, MessageModel>('Message', MessageSchema);

export { Message };
