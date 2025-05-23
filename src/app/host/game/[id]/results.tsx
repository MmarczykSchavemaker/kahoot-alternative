import {
  Answer,
  GameResult,
  Participant,
  Question,
  QuizSet,
  supabase,
} from '@/types/types'
import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'

export default function Results({
  quizSet,
  gameId, // This is the UUID, not the short game_code
}: {
  participants: Participant[]
  quizSet: QuizSet
  gameId: string // This is the UUID, not the short game_code
}) {
  const [gameResults, setGameResults] = useState<GameResult[]>([])

  const { width, height } = useWindowSize()

  useEffect(() => {
    const getResults = async () => {
      // Query using the UUID (gameId)
      const { data, error } = await supabase
        .from('game_results')
        .select()
        .eq('game_id', gameId) // Using UUID for database relations
        .order('total_score', { ascending: false })
      if (error) {
        return alert(error.message)
      }

      setGameResults(data)
    }
    getResults()
  }, [gameId])

  return (
    <div
      className="
        w-full 
        min-h-screen 
        bg-contain bg-center bg-no-repeat
        md:bg-cover    /* na średnich ekranach tło będzie cover */
        md:h-screen     /* na średnich i większych wymuś wysokość pełnego widoku */
      "
      style={{
        backgroundImage: `url(https://ikbbaieshzipxzqstkvb.supabase.co/storage/v1/object/public/question-images//11_full_removed_upscaled.png)`,
      }}
    >
      <div className="text-center">
        <h1 className="text-3xl my-4 py-4 px-12 bg-white inline-block rounded font-bold">
          {quizSet.name}
        </h1>
      </div>
      <div className="flex justify-center items-stretch">
        <div>
          {gameResults.map((gameResult, index) => (
            <div
              key={gameResult.participant_id}
              className={`flex justify-between items-center bg-white py-2 px-4 rounded my-4 max-w-2xl w-full ${
                index < 3 ? 'shadow-xl font-bold' : ''
              }`}
            >
              <div className={`pr-4 ${index < 3 ? 'text-3xl' : 'text-l'}`}>
                {index + 1}
              </div>
              <div
                className={`flex-grow font-bold ${
                  index < 3 ? 'text-5xl' : 'text-2xl'
                }`}
              >
                {gameResult.nickname}
              </div>
              <div className="pl-2">
                <span className="text-xl font-bold">
                  {gameResult.total_score}
                </span>
                <span>points</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Confetti width={width} height={height} recycle={true} />
    </div>
  )
}
