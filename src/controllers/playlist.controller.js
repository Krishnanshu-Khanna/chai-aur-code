import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;
  if (!name) {
    throw new ApiError(400, "Name is required");
  }
  if (!description) {
    throw new ApiError(400, "Description is required");
  }
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(500, "Failed to create playlist");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully")
    );

});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

   if (!isValidObjectId(playlistId)) {
     throw new ApiError(400, "Invalid PlaylistId");
   }

   const playlist = await Playlist.findById(playlistId);

   if (!playlist) {
     throw new ApiError(404, "Playlist not found");
   }

   const playlistVideos = await Playlist.aggregate([
     {
       $match: {
         _id: new mongoose.Types.ObjectId(playlistId),
       },
     },
     {
       $lookup: {
         from: "videos",
         localField: "videos",
         foreignField: "_id",
         as: "videos",
       },
     },
     {
       $match: {
         "videos.isPublished": true,
       },
     },
     {
       $lookup: {
         from: "users",
         localField: "owner",
         foreignField: "_id",
         as: "owner",
       },
     },
     {
       $addFields: {
         totalVideos: {
           $size: "$videos",
         },
         totalViews: {
           $sum: "$videos.views",
         },
         owner: {
           $first: "$owner",
         },
       },
     },
     {
       $project: {
         name: 1,
         description: 1,
         createdAt: 1,
         updatedAt: 1,
         totalVideos: 1,
         totalViews: 1,
         videos: {
           _id: 1,
           "videoFile.url": 1,
           "thumbnail.url": 1,
           title: 1,
           description: 1,
           duration: 1,
           createdAt: 1,
           views: 1,
         },
         owner: {
           username: 1,
           fullName: 1,
           "avatar.url": 1,
         },
       },
     },
   ]);

   return res
     .status(200)
     .json(
       new ApiResponse(200, playlistVideos[0], "playlist fetched successfully")
     );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid PlaylistId or videoId");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (
    (playlist.owner?.toString() && video.owner.toString()) !==
    req.user?._id.toString()
  ) {
    throw new ApiError(400, "only owner can add video to thier playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "failed to add video to playlist please try again");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Added video to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid PlaylistId or videoId");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (
    (playlist.owner?.toString() && video.owner.toString()) !==
    req.user?._id.toString()
  ) {
    throw new ApiError(404, "only owner can remove video from thier playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Removed video from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
   const { playlistId } = req.params;

   if (!isValidObjectId(playlistId)) {
     throw new ApiError(400, "Invalid PlaylistId");
   }

   const playlist = await Playlist.findById(playlistId);

   if (!playlist) {
     throw new ApiError(404, "Playlist not found");
   }

   if (playlist.owner.toString() !== req.user?._id.toString()) {
     throw new ApiError(400, "only owner can delete the playlist");
   }

   await Playlist.findByIdAndDelete(playlist?._id);

   return res
     .status(200)
     .json(new ApiResponse(200, {}, "playlist updated successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!name) {
    throw new ApiError(400, "Name is required");
  }
  if (!description) {
    throw new ApiError(400, "Description is required");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  if (req.user?._id.toString() !== playlist.owner.toString()) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }
  const playlist = await Playlist.findById(playlistId);
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
