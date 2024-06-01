import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // User ID of one who is subscribing
        ref: "User",
        required: true
    },
    channel: {
        type: Schema.Types.ObjectId, // Channel ID of the one who is being subscribed to
        ref: "Channel",
        required: true
    }
},{timestamps: true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);