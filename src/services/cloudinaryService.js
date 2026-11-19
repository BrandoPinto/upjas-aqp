const CLOUD_NAME = "dcv8xhad9";
const UPLOAD_PRESET = "iraapp_unsigned";

export const subirImagen = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "iraapp");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.secure_url;
};