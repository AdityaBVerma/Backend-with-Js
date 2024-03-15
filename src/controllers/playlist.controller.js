import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist

    if (!(name && description)) {
        throw new ApiError(400, "Name and description are required")
    }
    const playlist = await Playlist.create({
        name,
        discription: description,
        owner: req.user?._id
    })
    if (!playlist) {
        throw new ApiError(400, "Error in creating the playlist")
    }
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!(userId && isValidObjectId(userId))) {
        throw new ApiError(400, "Invalid user Id")
    }
    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from : "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
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
                        $addFields: {
                            onwer: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $sort: {
                createdAt: 1
            }
        }
    ])
    if (!playlist.length) {
        throw new ApiError(400, "Couldn't fetch playlist")
    }
    return res.status(200).json(new ApiResponse(200, playlist, "User's playlists found successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!(playlistId && isValidObjectId(playlistId))) {
        throw new ApiError(400, "Invalid Playlist Id")
    }
    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from : "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
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
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
    ])
    if (!playlist.length) {
        throw new ApiError(400, "playlist not found")
    }
    return res.status(200).json(new ApiResponse(200, playlist[0], "Playlist found successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!(playlistId && isValidObjectId(playlistId))) {
        throw new ApiError(400, "Invalid Playlist Id")
    }
    if (!(videoId && isValidObjectId(videoId))) {
        throw new ApiError(400, "Invalid Video Id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    const playlistprev = await Playlist.findById(playlistId)
    if (playlistprev.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You cannot perform this task")
    }
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new: true
        }
    )
    if (!playlist) {
        throw new ApiError(400, "Error pushing the video to the playlist")
    }
    return res.status(200).json(new ApiResponse(200, playlist, "video added successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!(playlistId && isValidObjectId(playlistId))) {
        throw new ApiError(400, "Invalid Playlist Id")
    }
    if (!(videoId && isValidObjectId(videoId))) {
        throw new ApiError(400, "Invalid Video Id")
    }
    const video = await Video.findById(videoId)
    if (video) {
        throw new ApiError(400, "Video not found")
    }
    const playlistprev = await Playlist.findById(playlistId)
    if (playlistprev.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You cannot perform this task")
    }
    const playlist = await Playlist.findByIdAndDelete(
        playlistId,
        {
            $pull: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new: true
        }
    )
    if (playlist) {
        throw new ApiError(400, "Error removing the video from playlist")
    }
    return res.status(200).json(new ApiError(200, playlist, "Video removed successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!(playlistId && isValidObjectId(playlistId))) {
        throw new ApiError(400, "Invlaid Playlist Id")
    }
    const playlist = await Playlist.findById(playlistId)
    if (playlist.onwer.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You cannot perform this task")
    }
    const deletePlaylist = await Playlist.deleteOne({ owner: mongoose.Types.ObjectId(playlistId) });
    if (!deletePlaylist) {
        throw new ApiError(400, "Couldn't delete playlist")
    }
    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!(playlistId && isValidObjectId(playlistId))) {
        throw new ApiError(400, "Invalid Playlist Id")
    }
    const playlist = await Playlist.findById(playlistId)
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You cannot perform this task")
    }
    if (!(name && description)) {
        throw new ApiError(400, "Both name and description is required")
    }
    playlist.name = name
    playlist.discription = description
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}