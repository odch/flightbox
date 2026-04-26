import React, { useEffect, useRef } from 'react';
import isElementInViewport from '../util/isElementInViewport';

const DEFAULT_BOTTOM_THRESHOLD = 50;

export const AutoLoad = (List: any) => {
  const AutoLoadWrapper: React.FC<any> = (props) => {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const bottomMarkerRef = useRef<HTMLDivElement | null>(null);
    const prevItemsLengthRef = useRef(props.items.length);

    const latestPropsRef = useRef(props);
    latestPropsRef.current = props;

    useEffect(() => {
      const findScrollableElement = (): EventTarget => {
        let element: any = elementRef.current;
        while (element && element !== document) {
          const style = window.getComputedStyle(element);
          const overflow = style.getPropertyValue('overflow');
          if (overflow === 'auto' || overflow === 'scroll') return element;
          element = element.parentNode;
        }
        return window;
      };

      const getBottomThreshold = () =>
        typeof latestPropsRef.current.bottomThreshold === 'number'
          ? latestPropsRef.current.bottomThreshold
          : DEFAULT_BOTTOM_THRESHOLD;

      const isEndReached = (el: any) => {
        if (el === document) {
          const scrollY = window.scrollY || window.pageYOffset;
          return (
            window.innerHeight + scrollY + getBottomThreshold() >=
            document.body.offsetHeight
          );
        }
        return el.offsetHeight + el.scrollTop === el.scrollHeight;
      };

      const handleScroll = (e: Event) => {
        if (
          isEndReached(e.target) &&
          !latestPropsRef.current.autoLoadDisabled
        ) {
          latestPropsRef.current.loadItems();
        }
      };

      const scrollable = findScrollableElement();
      scrollable.addEventListener('scroll', handleScroll);
      return () => scrollable.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
      if (
        props.items.length > prevItemsLengthRef.current &&
        bottomMarkerRef.current &&
        isElementInViewport(bottomMarkerRef.current)
      ) {
        props.loadItems();
      }
      prevItemsLengthRef.current = props.items.length;
    }, [props.items.length]);

    return (
      <div className={props.className} ref={elementRef}>
        <List {...props} />
        <div ref={bottomMarkerRef}></div>
      </div>
    );
  };

  return AutoLoadWrapper;
};
