import type { Arrayable } from '@vueuse/core';
import type { Cesium3DTileset, Primitive, PrimitiveCollection } from 'cesium';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import type { MaybeRefOrAsyncGetter } from '../toAwaitValue';
import { computedAsync } from '@vueuse/core';
import { toValue, watchEffect } from 'vue';
import { toAwaitValue } from '../toAwaitValue';
import { useViewer } from '../useViewer';

// TODO   all primitive type in cesium
export type CesiumPrimitive = Primitive | PrimitiveCollection | Cesium3DTileset | any;

export interface UsePrimitiveOptions {
  /**
   * The collection of Primitive to be added
   * - `ground` : `useViewer().scene.groundPrimitives`
   * @default useViewer().scene.primitives
   */
  collection?: PrimitiveCollection | 'ground';

  /**
   * default value of `isActive`
   * @default true
   */
  isActive?: MaybeRefOrGetter<boolean>;

  /**
   * Ref passed to receive the updated of async evaluation
   */
  evaluating?: Ref<boolean>;
}

/**
 * Add `Primitive` to the `PrimitiveCollection`, automatically update when the data changes, and destroy the side effects caused by the previous `Primitive`.
 *
 * overLoaded1: Parameter supports passing in a single value.
 */
export function usePrimitive<T extends CesiumPrimitive = CesiumPrimitive>(
  primitive?: MaybeRefOrAsyncGetter<T | undefined>,
  options?: UsePrimitiveOptions
): ComputedRef<T | undefined>;

/**
 * Add `Primitive` to the `PrimitiveCollection`, automatically update when the data changes, and destroy the side effects caused by the previous `Primitive`.
 *
 * overLoaded2: Parameter supports passing in an array.
 */
export function usePrimitive<T extends CesiumPrimitive = CesiumPrimitive>(
  primitives?: MaybeRefOrAsyncGetter<Array<T | undefined>>,
  options?: UsePrimitiveOptions
): ComputedRef<T[] | undefined>;

export function usePrimitive<T extends Primitive>(
  data?: MaybeRefOrAsyncGetter<Arrayable<T | undefined>>,
  options: UsePrimitiveOptions = {},
) {
  const {
    collection,
    isActive = true,
    evaluating,
  } = options;

  const result = computedAsync(
    () => toAwaitValue(data),
    undefined,
    {
      evaluating,
    },
  );

  const viewer = useViewer();

  watchEffect((onCleanup) => {
    const _isActive = toValue(isActive);
    if (_isActive) {
      const list = Array.isArray(result.value) ? [...result.value] : [result.value];
      const _collection = collection === 'ground' ? viewer.value?.scene.groundPrimitives : (collection ?? viewer.value?.scene.primitives);

      list.forEach(item => (item && _collection?.add(item)));
      onCleanup(() => {
        !_collection?.isDestroyed() && list.forEach(item => item && _collection?.remove(item));
      });
    }
  });

  return result;
}
