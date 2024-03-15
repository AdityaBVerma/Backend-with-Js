import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import {Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!(channelId && isValidObjectId(channelId))) {
        throw new ApiError(400, "Invalid channel Id")
    }
    const isSubscribed = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })
    let unsubscribed
    let subscribe
    if (isSubscribed) {
        unsubscribed = await Subscription.findByIdAndDelete(isSubscribed._id)
    } else {
        subscribe = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
    }
    if (!(unsubscribed || subscribe)) {
        throw new ApiError(400, "Toggle failed")
    }
    return res.status(200).json(new ApiResponse(200, (isSubscribed)?unsubscribed:subscribe, "Toggle successfull"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!(channelId && isValidObjectId())) {
        throw new ApiError(400, "Invalid channel Id")
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addfields: {
                $first: "$subscriber"
            }
        }// you can project only subscriber so that we dont get channel in all docs 
    ])
    if (!subscribers.length) {
        throw new ApiError(400, "No documents found in subscribers")
    }
    return res.status(200).json(new ApiResponse(200, subscribers, "Channel subscribers fetched successfully"))
})


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!(subscriberId && isValidObjectId(subscriberId))) {
        throw new ApiError(400, "Invalid subscriber id")
    }
    const channelsSubscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "user",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addfields: {
                $first: "$channel"
            }
        }
    ])
    if (!channelsSubscribedTo.lenght) {
        throw new ApiError(400, "No channels found in subscribed to")
    }
    return res.status(200).json(new ApiResponse(400, channelsSubscribedTo, "Channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}