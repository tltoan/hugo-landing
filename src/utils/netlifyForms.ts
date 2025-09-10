export const encode = (data: Record<string, string>) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
};

export const submitToNetlify = async (
  formName: string,
  formData: Record<string, string>
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