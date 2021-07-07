import mongoose from 'mongoose';

interface BlackListAttr {
  blacklister: string;
  blacklistee: string;
}

export interface BlackListDocument extends mongoose.Document, BlackListAttr {}

interface BlackListModel extends mongoose.Model<BlackListDocument> {
  build: (attr: BlackListAttr) => BlackListDocument;
}

const BlackListSchema = new mongoose.Schema(
  {
    blacklister: { type: String, required: true, trim: true },
    blacklistee: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

BlackListSchema.statics.build = (attr: BlackListDocument) => new BlackList(attr);

const BlackList = mongoose.model<BlackListDocument, BlackListModel>('BlackList', BlackListSchema);
export { BlackList };
