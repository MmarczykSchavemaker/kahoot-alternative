'use client'

import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Choice, Game, Participant, Question, supabase } from '@/types/types'
import Lobby from './lobby'
import Quiz from './quiz'

enum Screens {
  lobby = 'lobby',
  quiz = 'quiz',
  results = 'result',
}

export default function Home({
  params: { id: gameCode }, // Rename to gameCode since we're using short codes in URLs
}: {
  params: { id: string }
}) {
  // Store the actual game UUID separately
  const [gameId, setGameId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // First fetch the actual UUID using the game code
  useEffect(() => {
    const fetchGameId = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('id')
        .eq('game_code', gameCode)
        .single()

      if (error) {
        console.error('Error fetching game:', error)
        alert('Game not found')
        return
      }

      setGameId(data.id)
      setLoading(false)
    }

    fetchGameId()
  }, [gameCode])

  const onRegisterCompleted = (participant: Participant) => {
    setParticipant(participant)
    if (gameId) getGame() // Only get game if gameId is available
  }

  const stateRef = useRef<Participant | null>()

  const [participant, setParticipant] = useState<Participant | null>()

  stateRef.current = participant

  const [currentScreen, setCurrentScreen] = useState(Screens.lobby)

  const [questions, setQuestions] = useState<Question[]>()

  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const getGame = async () => {
    if (!gameId) return // Safety check

    const { data: game } = await supabase
      .from('games')
      .select()
      .eq('id', gameId) // Use internal UUID
      .single()
    if (!game) return
    setCurrentScreen(game.phase as Screens)
    if (game.phase == Screens.quiz) {
      setCurrentQuestionSequence(game.current_question_sequence)
      setIsAnswerRevealed(game.is_answer_revealed)
    }

    getQuestions(game.quiz_set_id)
  }

  const getQuestions = async (quizSetId: string) => {
    const { data, error } = await supabase
      .from('questions')
      .select(`*, choices(*)`)
      .eq('quiz_set_id', quizSetId)
      .order('order', { ascending: true })
    if (error) {
      getQuestions(quizSetId)
      return
    }
    setQuestions(data)
  }

  // Only set up realtime listeners when we have the gameId
  useEffect(() => {
    if (!gameId) return // Don't proceed without gameId

    const setGameListener = (): RealtimeChannel => {
      return supabase
        .channel('game_participant')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${gameId}`, // Use internal UUID
          },
          (payload) => {
            if (!stateRef.current) return

            // start the quiz game
            const game = payload.new as Game

            if (game.phase == 'result') {
              setCurrentScreen(Screens.results)
            } else {
              setCurrentScreen(Screens.quiz)
              setCurrentQuestionSequence(game.current_question_sequence)
              setIsAnswerRevealed(game.is_answer_revealed)
            }
          }
        )
        .subscribe()
    }

    const gameChannel = setGameListener()
    return () => {
      supabase.removeChannel(gameChannel)
    }
  }, [gameId]) // Changed dependency from gameCode to gameId

  if (loading || !gameId) {
    return (
      <div className="bg-navy min-h-screen flex items-center justify-center">
        <div className="p-8 bg-black text-white rounded-lg">
          <h2 className="text-xl">Loading game...</h2>
        </div>
      </div>
    )
  }

  return (
    <main
      className="
       bg-navy
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
      {currentScreen == Screens.lobby && (
        <Lobby
          onRegisterCompleted={onRegisterCompleted}
          gameId={gameId}
        ></Lobby>
      )}
      {currentScreen == Screens.quiz && questions && (
        <Quiz
          question={questions![currentQuestionSequence]}
          questionCount={questions!.length}
          participantId={participant!.id}
          isAnswerRevealed={isAnswerRevealed}
        ></Quiz>
      )}
      {currentScreen == Screens.results && (
        <Results participant={participant!}></Results>
      )}
    </main>
  )
}

function Results({ participant }: { participant: Participant }) {
  return (
    <div className="flex justify-center items-center min-h-screen text-center">
      <div className="p-8 bg-black text-white rounded-lg">
        <h2 className="text-2xl pb-4">Hey {participant.nickname}！</h2>
        <p>Thanks for playing 🎉</p>
      </div>
    </div>
  )
}
