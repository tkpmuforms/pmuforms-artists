import axiosInstance from "../utils/axios/axiosSetup";

export const createArtist = async (data: []) =>
  axiosInstance.post("/artist/create", data);
