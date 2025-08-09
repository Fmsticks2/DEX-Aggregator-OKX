import type { RequestEvent } from '@sveltejs/kit'
import { OKX_API_KEY } from '$env/static/private'

const OKX_DEX_BASE_URL = 'https://www.okx.com/api/v5/dex/aggregator'

/**
 * OKX DEX Quote API endpoint
 * Proxies requests to OKX DEX API while hiding the API key
 */
export async function GET({ url }: RequestEvent) {
  const { searchParams } = url

  const chainId = searchParams.get('chainId')
  const fromTokenAddress = searchParams.get('fromTokenAddress')
  const toTokenAddress = searchParams.get('toTokenAddress')
  const amount = searchParams.get('amount')
  const slippage = searchParams.get('slippage') || '0.5'

  if (!chainId || !fromTokenAddress || !toTokenAddress || !amount) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const okxParams = new URLSearchParams({
      chainId,
      fromTokenAddress,
      toTokenAddress,
      amount,
      slippage
    })

    const response = await fetch(
      `${OKX_DEX_BASE_URL}/quote?${okxParams}`,
      {
        headers: {
          'OK-ACCESS-KEY': OKX_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`OKX API error: ${response.status}`)
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('OKX DEX Quote API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch quote from OKX DEX' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}