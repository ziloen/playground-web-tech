/**
 * LRU 缓存 (Least recently used cache)
 *
 * https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
 */
export class LRUCache<K, V> extends Map<K, V> {
  constructor(readonly capacity: number) {
    super()
  }

  override set(key: K, value: V) {
    // 如果超出或即将超出，删除最旧的
    if (this.size >= this.capacity) {
      this.delete(this.keys().next().value!)
    }

    // 删除已有的 key，重新设置新的 key
    this.delete(key)
    super.set(key, value)

    return this
  }

  /**
   * 从当前 LRU 实例克隆一个新的 LRU 实例
   */
  clone() {
    return LRUCache.from(this, this.capacity)
  }

  /**
   * 从一个 Map 或 LRU 实例或数组创建一个 LRU 实例
   */
  static from<K, V>(map: Map<K, V> | LRUCache<K, V> | [K, V][], capacity: number) {
    const lru = new LRUCache<K, V>(capacity)
    for (const [k, v] of map) {
      lru.set(k, v)
    }
    return lru
  }
}
