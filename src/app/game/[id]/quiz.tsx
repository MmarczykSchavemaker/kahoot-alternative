import { QUESTION_ANSWER_TIME, TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Choice, Question, supabase } from '@/types/types'
import { useState, useEffect } from 'react'
import { ColorFormat, CountdownCircleTimer } from 'react-countdown-circle-timer'

export default function Quiz({
  question: question,
  questionCount: questionCount,
  participantId: playerId,
  isAnswerRevealed,
}: {
  question: Question
  questionCount: number
  participantId: string
  isAnswerRevealed: boolean
}) {
  const [chosenChoice, setChosenChoice] = useState<Choice | null>(null)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  useEffect(() => {
    setChosenChoice(null)
    setHasShownChoices(false)
  }, [question.id])

  const answer = async (choice: Choice) => {
    setChosenChoice(choice)

    const now = Date.now()
    const score = !choice.is_correct
      ? 0
      : 1000 -
        Math.round(
          Math.max(
            0,
            Math.min((now - questionStartTime) / QUESTION_ANSWER_TIME, 1)
          ) * 1000
        )

    const { error } = await supabase.from('answers').insert({
      participant_id: playerId,
      question_id: question.id,
      choice_id: choice.id,
      score,
    })
    if (error) {
      setChosenChoice(null)
      alert(error.message)
    }
  }

  return (
    <div className="h-screen flex flex-col items-stretch bg-navy relative">
      <div className="text-center">
        <h2
          className="
            pb-4 bg-blue-950 font-bold text-white
            text-xl sm:text-2xl md:text-3xl     /* responsywna wielkość czcionku */
            mx-4 sm:mx-8 md:mx-24 lg:mx-32 xl:mx-48  /* większe marginesy na dużych ekranach */
            my-4 sm:my-6 md:my-8                  /* responsywne marginesy pionowe */
            p-4 rounded inline-block
            max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-full  /* większa szerokość na dużych ekranach */
            break-words                            /* łamanie długich tekstów */
          "
          style={{
                textShadow: '5px 5px 3px rgba(0, 0, 0, 0.7)',
                fontWeight: '700',
              }}
        >
          {question.body}
        </h2>
      </div>

      {question.image_url && (
        <img
          src={question.image_url}
          alt="Question Image"
          className="w-[1080px] h-[500px] object-contain rounded mx-auto my-4"
       />
      )}

      {!isAnswerRevealed && chosenChoice && (
        <div className="flex-grow flex justify-center items-center">
          <div className="text-white text-2xl text-center p-4">
            Wait for others to answer...
          </div>
        </div>
      )}

      {!hasShownChoices && !isAnswerRevealed && (
        <div className="flex-grow text-transparent flex justify-center">
          <CountdownCircleTimer
            onComplete={() => {
              setHasShownChoices(true)
              setQuestionStartTime(Date.now())
            }}
            isPlaying
            duration={TIME_TIL_CHOICE_REVEAL / 1000}
            colors={['#fff', '#fff', '#fff', '#fff']}
            trailColor={'transparent' as ColorFormat}
            colorsTime={[7, 5, 2, 0]}
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        </div>
      )}

      {hasShownChoices && !isAnswerRevealed && !chosenChoice && (
        <div className="flex-grow flex flex-col items-stretch">
          <div className="flex-grow"></div>
          <div className="flex justify-between flex-wrap p-4">
            {question.choices.map((choice, index) => (
              <div key={choice.id} className="w-1/2 p-1">
                <button
                  onClick={() => answer(choice)}
                  disabled={chosenChoice !== null || isAnswerRevealed}
                  className={`px-4 py-6 w-full text-xl rounded text-white flex justify-between md:text-2xl md:font-bold
              ${
                index === 0
                  ? 'bg-red-500'
                  : index === 1
                  ? 'bg-blue-500'
                  : index === 2
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }
              ${isAnswerRevealed && !choice.is_correct ? 'opacity-60' : ''}
             `}
                >
                  <div>{choice.body}</div>
                  {isAnswerRevealed && (
                    <div>
                      {choice.is_correct && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      )}
                      {!choice.is_correct && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAnswerRevealed && (
        <div className="flex-grow flex justify-center items-center flex-col pb-4">
          <h2 className="text-white text-2xl text-center pb-2">
            {chosenChoice?.is_correct ? 'Correct' : 'Incorrect'}
          </h2>
          <div
            className={`text-white rounded-full p-4  ${
              chosenChoice?.is_correct ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {chosenChoice?.is_correct && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            )}
            {!chosenChoice?.is_correct && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      <div className="flex text-white py-2 px-4 items-center bg-black">
        <div className="text-2xl">
          {question.order + 1}/{questionCount}
        </div>
      </div>
    </div>
  )
}
