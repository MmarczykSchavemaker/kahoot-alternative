import '../../../globals.css'
import { Participant, supabase } from '@/types/types'
import { useQRCode } from 'next-qrcode'
import { useEffect, useState } from 'react'


export default function Lobby({
  participants: participants,
  gameId,
}: {
  participants: Participant[]
  gameId: string
}) {
  const { Canvas } = useQRCode()
  const [gameCode, setGameCode] = useState<string>("")
  
  // Fetch the game code on component mount
  useEffect(() => {
    const fetchGameCode = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('game_code')
        .eq('id', gameId)
        .single()
      
      if (data && !error) {
        setGameCode(data.game_code ?? "") // Dodaj ?? "" aby obsłużyć null
      }
    }
    
    fetchGameCode()
  }, [gameId])

  const onClickStartGame = async () => {
    const { data, error } = await supabase
      .from('games')
      .update({ phase: 'quiz' })
      .eq('id', gameId) // Still using UUID internally
    if (error) {
      return alert(error.message)
    }
  }

  return (
    <main className="flex justify-center items-center min-h-screen bg-navy">
      <div className="block m-auto bg-black p-12">
          <button
            className="mx-auto bg-white py-4 px-12 block text-black"
            onClick={onClickStartGame}
          >
            Start Game
          </button>
          <br/>
        <h2 className="text-center text-xl bg-white py-4 px-12 block text-black">
            Dołącz do gry pod tym linkiem lub zeskanuj kod QR:
            <br />
            <a
              className="text-blue-500"
              href={`https://schave.vercel.app/game/${gameCode || '...'}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              https://schave.vercel.app/game/{gameCode || '...'}
            </a>
          </h2>
      <div className="flex justify-between m-auto p-12">
        <div className="w-96">
          <div className="flex justify-start flex-wrap pb-4">
            {participants.map((participant) => (
              <div
                className="text-xl m-2 p-2 bg-green-500"
                key={participant.id}
              >
                {participant.nickname}
              </div>
            ))}
          </div>
         
        </div>
        <div className="pl-4">
          {gameCode && (
            <Canvas
              text={`https://schave.vercel.app/game/${gameCode}`}
              options={{
                errorCorrectionLevel: 'M',
                margin: 3,
                scale: 4,
                width: 400,
              }}
            />
          )}
        </div>
      </div>
      </div>
    </main>
  )
}
