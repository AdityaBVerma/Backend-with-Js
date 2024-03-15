import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary, deleteVideoFromCloudinary} from "../utils/cloudinary.js"
import { Like } from "../models/like.model.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const options = {
        page,
        limit,
    }
    let matchStage = {}
    if (userId && isValidObjectId(userId)) {
        matchStage = {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    } else if (query) {
        matchStage = {
            $match:{
                $or: [
                    {title: {$regex: query, $options: "i"}},
                    {description: {$regex: query, $options: "i"}},
                    ]
            }
        }
    }else {
        matchStage["$match"]={}
    }
    if (userId && query) {
        matchStage = {
            $match:{
                owner : new mongoose.Types.ObjectId(userId),
                $or: [
                        {title: {$regex: query, $options: "i"}},
                        {description: {$regex: query, $options: "i"}},
                ]
            }
        }
    }
    let sortStage = {}
    if (sortBy && sortType) {
        sortStage["$sort"] = {
            [sortBy]: sortType
        };
    } else {
        sortStage["$sort"] = {
            createdAt: -1
        }
    }
    const videos = await Video.aggregate([
        matchStage,
        {
            $lookup: {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
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
        sortStage,
        {
            $skip: (page -1) * limit
        },
        {
            $limit: limit
        },
        {
            $addFields:{
                owner:{
                    $first: "$owner"
                },
                views: {
                    $sum: ["$views", 1]
                },
                likeCount: {
                    $size: "$likes"
                }
            }
        }
    ])

    Video.aggregatePaginate(videos, options)
    .then((result) => {
        return res.status(200).json(new ApiResponse(200, result, "fetched all videos successfully"))
    })
    .catch((error) => {
        throw new ApiError(400, error.message || "Cannot aggregatepaginate the page")
    })
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    // get localpath(videoFile, thumbnail) -> verify localpath -> upload on cloudinary
    // check response of upload in cloudinary 
    // create 
    // return response
    if ([title, description].some((field) => field.trim()==="")) {
        throw new ApiError(400, "Thumbnail and description both are required")
    }
    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!(videoFileLocalPath || thumbnailLocalPath)) {
        throw new ApiError(400, "videofile is required")
    }

    const videofile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videofile) {
        throw new ApiError(500, "Problem in uploading videofile on cloudinary")
    }
    if (!thumbnail) {
        throw new ApiError(500, "Problem in uploading thumbnail on cloudinary")
    }

    const video = await Video.create({
        title,
        discription: description,
        duration: videofile.duration,
        videofile : {url: videofile.url, public_id: videofile.public_id },
        thumbnail : {url: thumbnail.url, public_id: thumbnail.public_id },
        duration : videofile.duration,
        owner: req.user?._id
    })
    return res.status(200).json(new ApiResponse(200, video, "video uploaded sucessfully"))
})

    //TODO: get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid videoId")
    }
    const videofound = await Video.findById(videoId)
    if(!videofound){
        throw new ApiError(400, "video not found");
    }
    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project:{
                            username: 1,
                            fullName: 1,
                            avatar: 1
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
            $addFields: {
                likeCount: {
                    $size: "$likes"
                },
                views: {
                    $sum: ["$views", 1]
                },
                owner:{
                    $first: "$owner"
                }
            }
        }
    ])

    if (!video.length) {
        throw new ApiError(500, "couldn't get video")
    }
    
// increasing the view count as the user has opened
    await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                views: video[0].views
            }
        }
    )

    return res.status(200).json(
        new ApiResponse(200, video[0], "video fetched by videoid successfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail

    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid videoId")
    }

    const {title,description} = req.body

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(200, "you cannot perform this operation")
    }

    const thumbnailLocalPath = req.file?.path
    let thumbnail
    if (thumbnailLocalPath) {
        await deleteFromCloudinary(video.thumbnail.public_id)
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    }
    if (title) {
        video.title = title
    }
    if (description) {
        video.discription = description
    }
    if (thumbnail) {
        video.thumbnail= {url: thumbnail.url, public_id: thumbnail.public_id}
    }
    video.save({validateBeforesave: true})
    return res.status(200).json(
        new ApiResponse(200, video, "video details updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid videoId")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "video not found");
    }

    if(video.owner.toString()!== req.user._id.toString()){
        throw new ApiError(400, "you cannot perform this operation")
    }
    await deleteVideoFromCloudinary(video.videofile.public_id)
    await deleteFromCloudinary(video.thumbnail.public_id)

    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if (deletedVideo) {
        Like.deleteMany({video: videoId})
        Comment.deleteMany({video: videoId})
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video ID")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "video not found")
    }
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "you cannot perform this operation")
    }
    video.isPublished = !video.isPublished
    return res.status(200).json( new ApiResponse(200, video, "toggled state of publish"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}