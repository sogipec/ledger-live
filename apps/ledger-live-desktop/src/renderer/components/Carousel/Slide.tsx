import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { useSpring, animated } from "react-spring";
import { openURL } from "~/renderer/linking";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { Wrapper, Label, IllustrationWrapper } from "~/renderer/components/Carousel";
import { useHistory } from "react-router-dom";
import Image from "../Image";
import { track } from "~/renderer/analytics/segment";
import { ContentCard } from "~/types/dynamicContent";

const Layer = styled(animated.div)<{
  image: string;
  width: number;
  height: number;
}>`
  // prettier-ignore
  background-image: url('${p => p.image}');
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
  will-change: transform;
  position: absolute;
  width: ${p => p.width}px;
  height: ${p => p.height}px;
  transform-origin: top left;
`;

const EllipsedText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

type Props = ContentCard;

const Slide = ({ id, url, path, title, description, image, imgs, onClickOnSlide }: Props) => {
  const history = useHistory();
  const [{ xy }, set] = useSpring<{
    xy: number[];
    config: { mass: number; tension: number; friction: number };
  }>(() => ({
    xy: [-120, -30],
    config: { mass: 10, tension: 550, friction: 140 },
  }));
  const getTransform = (offsetX: number, effectX: number, offsetY: number, effectY: number) => ({
    transform: xy.interpolate(
      // @ts-expect-error react-spring types are broken
      (x, y) => `translate3d(${x / effectX + offsetX}px,${y / effectY + offsetY}px, 0)`,
    ),
  });

  const ref = useRef<HTMLDivElement>(null);

  // React to the user mouse movement inside the banner for parallax effect
  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    set({ xy: [x - rect.width / 2, y - rect.height / 2] });
  };

  const onMouseLeave = () => set({ xy: [0, 0] });

  const onClick = useCallback(() => {
    if (onClickOnSlide) {
      onClickOnSlide(id);
    }
    if (path) {
      history.push({ pathname: path, state: { source: "banner" } });
      return;
    }
    if (url) {
      openURL(url);
    }
    track("contentcard_clicked", {
      contentcard: title,
      link: path || url,
      campaign: id,
      page: "Portfolio",
    });
  }, [history, id, path, title, url, onClickOnSlide]);

  // After initial slide-in animation, set the offset to zero
  useEffect(() => {
    setTimeout(() => {
      set({ xy: [0, 0] });
    }, 400);
  }, [set]);

  return (
    <Wrapper onClick={onClick} ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <Box flex={1} p={24}>
        <Label ff="Inter|SemiBold" fontSize={2}>
          {title}
        </Label>
        <EllipsedText
          style={{ marginBottom: 16 }}
          ff="Inter|Medium"
          color="palette.text.shade50"
          fontSize={4}
        >
          {description}
        </EllipsedText>
      </Box>
      {imgs && (
        <IllustrationWrapper>
          {imgs.map(({ source, transform, size }, i) => (
            <Layer
              key={i}
              // @ts-expect-error react-spring types are broken
              style={getTransform(...transform)}
              image={source}
              width={size.width}
              height={size.height}
            />
          ))}
        </IllustrationWrapper>
      )}
      {image && (
        <Box mr={8}>
          <Image resource={image} alt="" width={180} height={100} />
        </Box>
      )}
    </Wrapper>
  );
};

export default Slide;
