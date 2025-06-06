function arrayToReadableStream(array: string[][]): ReadableStream<string[]> {
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index < array.length) {
        controller.enqueue(array[index]);
        index++;
      } else {
        controller.close();
      }
    },
  });
}
