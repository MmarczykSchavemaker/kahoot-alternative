'use client'

import {
  Answer,
  Choice,
  Game,
  Participant,
  Question,
  QuizSet,
  supabase,
} from '@/types/types'
import { useEffect, useState } from 'react'
import Lobby from './lobby'
import Quiz from './quiz'
import Results from './results'
import '../../../globals.css'

enum AdminScreens {
  lobby = 'lobby',
  quiz = 'quiz',
  result = 'result',
}

export default function Home({
  params: { id: gameCode }, // This is now the game_code from the URL
}: {
  params: { id: string }
}) {
  const [currentScreen, setCurrentScreen] = useState<AdminScreens>(
    AdminScreens.lobby
  )
  const [gameId, setGameId] = useState<string | null>(null) // Store the actual UUID
  const [participants, setParticipants] = useState<Participant[]>([])
  const [quizSet, setQuizSet] = useState<QuizSet>()
  const [loading, setLoading] = useState(true)

  // First, fetch the actual gameId (UUID) using the game_code
  useEffect(() => {
    const fetchGameId = async () => {
      const { data: game, error } = await supabase
        .from('games')
        .select()
        .eq('game_code', gameCode)
        .single()

      if (error) {
        console.error('Error fetching game:', error)
        alert('Game not found')
        return
      }

      setGameId(game.id)
      setLoading(false)
    }

    fetchGameId()
  }, [gameCode])

  // Only proceed with other data fetching once we have the actual gameId
  useEffect(() => {
    if (!gameId) return

    const getQuestions = async () => {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select()
        .eq('id', gameId)
        .single()
      if (gameError) {
        console.error(gameError.message)
        alert('Error getting game data')
        return
      }
      const { data, error } = await supabase
        .from('quiz_sets')
        .select(`*, questions(*, choices(*))`)
        .eq('id', gameData.quiz_set_id)
        .order('order', {
          ascending: true,
          referencedTable: 'questions',
        })
        .single()
      if (error) {
        console.error(error.message)
        getQuestions()
        return
      }
      setQuizSet(data)
    }

    const setGameListener = async () => {
      const { data } = await supabase
        .from('participants')
        .select()
        .eq('game_id', gameId)
        .order('created_at')
      if (data) setParticipants(data)

      supabase
        .channel('game')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'participants',
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            setParticipants((currentParticipants) => {
              return [...currentParticipants, payload.new as Participant]
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            // start the quiz game
            const game = payload.new as Game
            setCurrentQuestionSequence(game.current_question_sequence)
            setCurrentScreen(game.phase as AdminScreens)
          }
        )
        .subscribe()

      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select()
        .eq('id', gameId)
        .single()

      if (gameError) {
        alert(gameError.message)
        console.error(gameError)
        return
      }

      setCurrentQuestionSequence(gameData.current_question_sequence)
      setCurrentScreen(gameData.phase as AdminScreens)
    }

    getQuestions()
    setGameListener()
  }, [gameId])

  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)

  if (loading) {
    return (
      <div className="bg-green-600 min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Loading game...</div>
      </div>
    )
  }

  return (
    <main className="bg-green-600 min-h-screen">
      {currentScreen == AdminScreens.lobby && gameId && (
        <Lobby participants={participants} gameId={gameId}></Lobby>
      )}
      {currentScreen == AdminScreens.quiz && gameId && quizSet && (
        <Quiz
          question={quizSet.questions![currentQuestionSequence]}
          questionCount={quizSet.questions!.length}
          gameId={gameId}
          participants={participants}
        ></Quiz>
      )}
      {currentScreen == AdminScreens.result && gameId && quizSet && (
        <Results
          participants={participants}
          quizSet={quizSet}
          gameId={gameId}
        ></Results>
      )}
    </main>
  )
}
