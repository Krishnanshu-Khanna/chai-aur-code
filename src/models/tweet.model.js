import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// // Add a pre-save hook
// tweetSchema.pre("save", function (next) {
//   if (!this.content) {
//     return next(new Error("Content is required"));
//   }

//   this.content = this.content.trim();

//   if (this.content.length === 0) {
//     return next(new Error("Content cannot be empty"));
//   }

//   next();
// });

export const Tweet = mongoose.model("Tweet", tweetSchema);
