import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ImageWithFallback from "./image-with-fallback";

vi.mock("next/image", () => ({
  default: ({ fill, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    void fill;
    return createElement("img", props);
  },
}));

describe("ImageWithFallback", () => {
  afterEach(cleanup);

  it("shows the placeholder when no image is provided", () => {
    render(
      <ImageWithFallback
        src={null}
        fallbackSrc="/course-placeholder.webp"
        alt="Course"
        fill
      />,
    );

    expect(screen.getByRole("img", { name: "Course" })).toHaveAttribute(
      "src",
      "/course-placeholder.webp",
    );
  });

  it("replaces an image that fails to load with the placeholder", () => {
    render(
      <ImageWithFallback
        src="https://cdn.example.com/missing-course.webp"
        fallbackSrc="/course-placeholder.webp"
        alt="Course"
        fill
      />,
    );

    const image = screen.getByRole("img", { name: "Course" });
    fireEvent.error(image);

    expect(image).toHaveAttribute("src", "/course-placeholder.webp");
  });
});
