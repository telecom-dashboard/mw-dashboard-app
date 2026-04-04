import api from "./axios";

export const uploadMicrowaveLinkExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/microwave-link-imports/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};