// syndicateMissions: The Holdfasts, Cavia
// globalUpgrades
// duviriCycle
// alerts
// Riven trading
// Ticker
export default function Warframe() {
  useEffect(() => {
    const apiBase = 'https://api.warframestat.us'
    const url = new URL('/pc', apiBase)
    // url.searchParams.set('language', 'en')

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log(data)
      })
  }, [])

  return (
    <div>
      syndicateMissions
    </div>
  )
}
