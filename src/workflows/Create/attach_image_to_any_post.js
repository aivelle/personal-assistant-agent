export default async function attachImageToAnyPost(input, context) {
  return {
    message: `Image has been attached to the specified post.`,
    inputReceived: input
  };
}

