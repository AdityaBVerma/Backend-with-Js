import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const options = {
        page: page,
        limit: limit,
    };
    const comments = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "commentOwner",
                foreignField: "_id",
                as: "commentOwner",
                pipeline: [
                    {
                        $project:{
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields:{
                likecount:{
                    $size: "$likes"
                },
                commentOwner:{
                    $first: "$commentOwner"
                }
            }
        }
    ])
    if (!comments.length) {
        throw new ApiError(404, "couldn't get comments")
    }
    await Comment
    .aggregatePaginate(comments, options)
    .then((result) => {
        return res.status(200).json(new ApiResponse(200,result ,"comments fetched succesfully"))
    })
    .catch((err) => {
        throw new ApiError(404, err || "Cannot aggregatepagginate the page")
    })

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body
    const { videoId } = req.params

    if (!(videoId.trim()=='' && isValidObjectId(videoId))) {
        throw new ApiError(404, "Invalid video Id")
    }

    if (content.trim()=='') {
        throw new ApiError(404, "Content in the comment is required")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"Video not found")
    }

    const comment = await Comment.create({
        content,
        video : videoId,
        commentOwner: req.user?._id
    })
    
    if (!(comment)) {
        throw new ApiError(404, "Error in creating a new comment")
    }
    res.status(200).json(new ApiResponse(200, comment, "Comment created successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { content } = req.body
    const { commentId } = req.params

    if (content.trim()==='') {
        throw new ApiError(404, "Content is required")
    }
    if (!(commentId && isValidObjectId(commentId))) {
        throw new ApiError(404, "Invalid comment Id")
    }
    const comment = await Comment.findById(commentId) 
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (comment.commentOwner.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "You cannot perform this task")
    }
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content : content
            }
        },
        {
            new: true
        }
    )
    if (!updatedComment) {
        throw new ApiError(500, "Eerror in updating Comment")
    }
    res.status(200).json(new ApiResponse(200, updateComment, "Comment Updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!(commentId && isValidObjectId(commentId))) {
        throw new ApiError(404, "Invalid Comment Id")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (comment.commentOwner.toString()!== req.user?._id.toString()) {
        throw new ApiError(404, "You cannot perform this task")
    }
    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if (!deletedComment) {
        throw new ApiError(404, "Error in deleting the comment")
    }
    await Like.deleteMany({comment: commentId})
    res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }