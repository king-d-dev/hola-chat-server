import mongoose from 'mongoose';

interface UserAttr {
  email: string;
}

export interface UserDocument extends mongoose.Document, UserAttr {}

interface UserModel extends mongoose.Model<UserDocument> {
  build: (attr: UserAttr) => UserDocument;
}

const UserSchema = new mongoose.Schema(
  { email: { type: String, required: true, trim: true, unique: true }, password: { type: String, required: true } },
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

UserSchema.statics.build = (attr: UserDocument) => new User(attr);

const User = mongoose.model<UserDocument, UserModel>('User', UserSchema);
export { User };
