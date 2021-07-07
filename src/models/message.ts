import mongoose from 'mongoose';

interface MessageAttr {
  clientId: string /** this is an id generated in the browser to track a few changes such as message delivered status */;
  text: string;
  sender: string;
  recipient: string;
  sentAt: Date;
  deliveredAt?: Date;
}

export interface MessageDocument extends mongoose.Document, MessageAttr {}

interface MessageModel extends mongoose.Model<MessageDocument> {
  build: (attr: MessageAttr) => MessageDocument;
}

const MessageSchema = new mongoose.Schema<MessageDocument, MessageModel>(
  {
    clientId: { type: String, required: true },
    text: { type: String, required: true },
    sender: { type: String, required: true },
    recipient: { type: String, required: true },
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
