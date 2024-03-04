import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if (!content) {
        throw new ApiError(400, "No content to tweet")
    }
    const tweet = await Tweet.create({
        content,
        owner : req.user?._id
    })
    if (!tweet) {
        throw new ApiError(500, "Error while creating tweet")
    }
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet posted successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if (!(userId && isValidObjectId(userId))) {
        throw new ApiError(400, "Enter a valid User Id")
    }
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "like"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likeCount: {
                    $size: "$like"
                }
            }
        }
    ])
    if (!tweets.length) {
        throw new ApiError(400, "Couldn't find user's tweets")
    }
    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    if (!(tweetId && isValidObjectId(tweetId))) {
        throw new ApiError(400, "Invalid tweet Id")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }
    if (!content) {
        throw new ApiError(400, "No content to update")
    }
    if (tweet.owner.toString() !== (req.user._id).toString()) {
        throw new ApiError(400, "You cannot perform this task")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content,
            }
        },
        {
            new: true
        }
    )
    if (!updateTweet) {
        throw new ApiError(400, "Error while updating tweet")
    }
    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if (!(tweetId && isValidObjectId(tweetId))) {
        throw new ApiError(400, "Invalid tweet Id")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }
    if ((tweet.owner).toString() !== (req.user?._id).toString()) {
        throw new ApiError(400, "You cannot perform this action")
    }
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    if (!deletedTweet) {
        throw new ApiError(400, "Couldn't delete tweet")
    }
    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}