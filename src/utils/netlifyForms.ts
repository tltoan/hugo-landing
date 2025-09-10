export const encode = (data: { [key: string]: any }) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(String(data[key])))
    .join("&");
};

export const submitToNetlify = async <T extends { [key: string]: any }>(
  formName: string,
  formData: T
): Promise<boolean> => {
  try {
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encode({
        "form-name": formName,
        ...formData
      })
    });

    return response.ok;
  } catch (error) {
    console.error("Netlify form submission error:", error);
    return false;
  }
};