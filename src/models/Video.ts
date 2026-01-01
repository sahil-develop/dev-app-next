import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReply {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface IComment {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
  replies: IReply[];
}

export interface IVideo extends Document {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  tags: string[];
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  views: number;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IReply>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    text: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CommentSchema = new Schema<IComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    text: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
    replies: [ReplySchema],
  },
  { _id: true }
);

const VideoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    tags: [{ type: String }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    views: { type: Number, default: 0 },
    duration: { type: Number },
  },
  { timestamps: true }
);

VideoSchema.index({ status: 1, createdAt: -1 });
VideoSchema.index({ userId: 1, createdAt: -1 });
VideoSchema.index({ tags: 1 });

const Video: Model<IVideo> = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
export default Video;
