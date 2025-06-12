"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"

// Niveles de caracteres Hiragana
const nivelCaracteres = {
  1: ["a", "i", "u", "e", "o"],
  2: ["ka", "ki", "ku", "ke", "ko", "sa", "shi", "su", "se", "so"],
  3: ["ta", "chi", "tsu", "te", "to", "na", "ni", "nu", "ne", "no"],
  4: ["ha", "hi", "fu", "he", "ho", "ma", "mi", "mu", "me", "mo"],
  5: ["ya", "yu", "yo", "ra", "ri", "ru", "re", "ro", "wa", "wo", "n"],
}

// Umbrales de puntos para cada nivel
const umbrales = [0, 50, 5000, 6000, 12000]

// Mapeo de caracteres a símbolos Hiragana reales
const hiraganaMap: { [key: string]: string } = {
  a: "あ",
  i: "い",
  u: "う",
  e: "え",
  o: "お",
  ka: "か",
  ki: "き",
  ku: "く",
  ke: "け",
  ko: "こ",
  sa: "さ",
  shi: "し",
  su: "す",
  se: "せ",
  so: "そ",
  ta: "た",
  chi: "ち",
  tsu: "つ",
  te: "て",
  to: "と",
  na: "な",
  ni: "に",
  nu: "ぬ",
  ne: "ね",
  no: "の",
  ha: "は",
  hi: "ひ",
  fu: "ふ",
  he: "へ",
  ho: "ほ",
  ma: "ま",
  mi: "み",
  mu: "む",
  me: "め",
  mo: "も",
  ya: "や",
  yu: "ゆ",
  yo: "よ",
  ra: "ら",
  ri: "り",
  ru: "る",
  re: "れ",
  ro: "ろ",
  wa: "わ",
  wo: "を",
  n: "ん",
}

export default function HiraganaLearningApp() {
  const [character, setCharacter] = useState<string>("")
  const [points, setPoints] = useState<number>(0)
  const [options, setOptions] = useState<string[]>([])
  const [correctOption, setCorrectOption] = useState<string>("")
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const [resultColor, setResultColor] = useState<string>("")
  const [showVocabImages, setShowVocabImages] = useState<boolean>(true)
  const [vocabImageIndex, setVocabImageIndex] = useState<number>(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false)
  const [modoInversoActual, setModoInversoActual] = useState<boolean>(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const vocabTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Obtener nivel actual según puntos
  const obtenerNivelActual = (puntos: number): number => {
    for (let i = umbrales.length - 1; i >= 0; i--) {
      if (puntos >= umbrales[i]) {
        return i + 1
      }
    }
    return 1
  }

  // Obtener caracteres disponibles según nivel
  const obtenerCaracteresPorPuntaje = (puntos: number): string[] => {
    const lista: string[] = []
    const nivelMax = obtenerNivelActual(puntos)
    for (let lvl = 1; lvl <= nivelMax; lvl++) {
      if (nivelCaracteres[lvl as keyof typeof nivelCaracteres]) {
        lista.push(...nivelCaracteres[lvl as keyof typeof nivelCaracteres])
      }
    }
    return lista
  }

  // Reproducir sonido del carácter
  const reproducirSonido = (char: string, index?: number) => {
    const filename = index !== undefined ? `${char}_${index + 1}` : char
    const audio = new Audio(`/hiragana/${char}/${filename}.mp3`)
    audio.play().catch(() => {
      console.log("No se pudo reproducir el audio de:", filename)
    })
  }

  // Reproducir video del carácter

  // Mostrar nueva imagen/carácter
  const mostrarImagenVocalAleatoria = () => {
    const nivelActual = obtenerNivelActual(points)
    const siguienteThreshold = nivelActual < umbrales.length ? umbrales[nivelActual] : umbrales[umbrales.length - 1]
    const nivelThreshold = umbrales[nivelActual - 1]
    const progreso = (points - nivelThreshold) / (siguienteThreshold - nivelThreshold)

    // Determinar aleatoriamente si usar modo inverso cuando el progreso es >= 50%
    if (progreso >= 0.2) {
      setModoInversoActual(Math.random() < 0.7)
    } else {
      setModoInversoActual(false)
    }

    // Mostrar imágenes de vocabulario según progreso
    const mostrarVocab = progreso < 0.5 && showVocabImages

    // Seleccionar carácter
    const rnd = Math.random()
    const porcentajeSorpresa = 0.1
    let seleccion: string

    do {
      if (rnd < porcentajeSorpresa && nivelActual > 1) {
        // Carácter sorpresa de niveles anteriores
        const anteriores: string[] = []
        for (let lvl = 1; lvl < nivelActual; lvl++) {
          anteriores.push(...nivelCaracteres[lvl as keyof typeof nivelCaracteres])
        }
        seleccion = anteriores[Math.floor(Math.random() * anteriores.length)]
      } else {
        // Carácter del nivel actual
        let actuales = nivelCaracteres[nivelActual as keyof typeof nivelCaracteres]

        if (nivelActual === 2) {
          const refuerzo = ["sa", "ke", "ko", "i", "se", "so"]
          actuales = [...actuales, ...refuerzo, ...refuerzo, ...refuerzo] // duplicamos su aparición
        }

        seleccion = actuales[Math.floor(Math.random() * actuales.length)]
      }
    } while (seleccion === character)

    setCharacter(seleccion)
    setCorrectOption(seleccion)
    mostrarOpcionesVocales(seleccion)

    // Iniciar ciclo de imágenes de vocabulario
    if (mostrarVocab) {
      setVocabImageIndex(0)
      if (vocabTimerRef.current) {
        clearInterval(vocabTimerRef.current)
      }
      vocabTimerRef.current = setInterval(() => {
        setVocabImageIndex((prev) => (prev + 1) % 2) // Alternar entre 2 imágenes
      }, 5000)
    }
  }

  // Mostrar opciones de respuesta
  const mostrarOpcionesVocales = (correctChar: string) => {
    const pool = obtenerCaracteresPorPuntaje(points).filter((c) => c !== correctChar)
    const incorrectas = pool.sort(() => Math.random() - 0.5).slice(0, 3)
    const todasOpciones = [...incorrectas, correctChar].sort(() => Math.random() - 0.5)
    setOptions(todasOpciones)
    setSelectedOption("")
    setResult("")
  }

  // Manejar respuesta
  const manejarRespuesta = async () => {
    if (!selectedOption) {
      setResult("Selecciona una opción.")
      setResultColor("text-gray-500")
      return
    }

    if (selectedOption === correctOption) {
      setResult("✅ ¡Correcto!")
      setResultColor("text-green-600")
      setPoints((prev) => prev + 10)
    } else {
      let penalizacion = 10

      if (progreso >= 80) {
        // Calcular el 15% de los puntos actuales, redondeado al múltiplo de 10 más cercano
        const porcentaje = Math.round((points * 0.15) / 10) * 10
        penalizacion = porcentaje || 10 // en caso de 0 puntos, restar al menos 10
      } else if (progreso >= 50) {
        penalizacion = 30
      }

      setResult(`❌ Incorrecto. Era: ${correctOption}`)
      setResultColor("text-red-600")
      setPoints((prev) => Math.max(0, prev - penalizacion))
    }

    // Mostrar fondo de resultado
    setShowFeedback(true)

    // Ocultarlo y mostrar siguiente imagen
    setTimeout(() => {
      setShowFeedback(false)
      setResult("")
      mostrarImagenVocalAleatoria()
    }, 1000)
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 8.0 // velocidad x2
      videoRef.current.currentTime = 0 // empieza desde el inicio
      videoRef.current.play().catch(() => {
        console.log("No se pudo reproducir el video automáticamente")
      })
    }
  }, [character]) // Se activa cada vez que cambias de carácter

  // Inicialización
  useEffect(() => {
    mostrarImagenVocalAleatoria()

    return () => {
      if (vocabTimerRef.current) {
        clearInterval(vocabTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const savedPoints = localStorage.getItem("hiraganaPoints")
    if (savedPoints !== null) {
      setPoints(Number.parseInt(savedPoints))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("hiraganaPoints", points.toString())
  }, [points])

  const nivelActual = obtenerNivelActual(points)
  const siguienteThreshold = nivelActual < umbrales.length ? umbrales[nivelActual] : umbrales[umbrales.length - 1]
  const nivelThreshold = umbrales[nivelActual - 1]
  const progreso = Math.min(100, ((points - nivelThreshold) / (siguienteThreshold - nivelThreshold)) * 100)
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-indigo-800">Aprendizaje de Hiragana</CardTitle>

            <div className="flex justify-between items-center">
              {/* Puntaje */}
              <div className="text-lg font-semibold flex flex-col">
                <div className="flex items-center gap-3">
                  Puntos:{" "}
                  <span className={points > 0 ? "text-green-600" : points < 0 ? "text-red-600" : "text-black"}>
                    {points}
                  </span>
                  <button
                    onClick={() => setPoints(0)}
                    className="text-sm text-indigo-600 underline hover:text-indigo-800 transition"
                    title="Reiniciar puntaje"
                  >
                    Reiniciar
                  </button>
                </div>

                {/* Mostrar penalización actual */}
                <div className="text-sm text-gray-600 mt-1">
                  Penalización por error:{" "}
                  {progreso >= 80 ? Math.max(10, Math.round((points * 0.15) / 10) * 10) : progreso >= 50 ? 30 : 10}{" "}
                  puntos
                </div>
              </div>

              {/* Nivel */}
              <div className="text-lg font-semibold">
                Nivel: {nivelActual} {progreso >= 50 && <span className="text-purple-600">(Modo Mixto)</span>}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {/* Columna principal - Carácter */}
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="text-center">
                <div
                  className="text-[5rem] sm:text-[8rem] lg:text-[10rem] font-bold mb-4 cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => reproducirSonido(character)}
                >
                  {modoInversoActual ? character.toUpperCase() : hiraganaMap[character] || character}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Columna de video */}
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-gray-200 rounded-lg mb-4 flex items-center justify-center h-[200px]">
                  {character && !modoInversoActual && (
                    <video
                      key={character}
                      src={`/hiragana/${character}/${character}.mp4`}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="rounded w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] lg:w-[200px] lg:h-[200px]"
                    />
                  )}
                  {modoInversoActual && (
                    <div className="text-gray-500 text-center">
                      <p>Video oculto en modo avanzado</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Columna de vocabulario */}
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="show-vocab"
                  checked={showVocabImages}
                  onCheckedChange={(checked) => setShowVocabImages(checked as boolean)}
                />
                <Label htmlFor="show-vocab">Mostrar imágenes de vocabulario</Label>
              </div>

              {showVocabImages && (
                <div className="text-center">
                  <div
                    className="bg-gray-200 rounded-lg mb-4 h-[200px] flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors"
                    onClick={() => reproducirSonido(character, vocabImageIndex)}
                  >
                    {character && showVocabImages && (
                      <Image
                        src={`/hiragana/${character}/${character}_${vocabImageIndex + 1}.jpg`}
                        alt={`Vocabulario ${character}`}
                        width={200}
                        height={200}
                        className="rounded"
                      />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sección de quiz */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              {modoInversoActual ? "¿Cuál es el símbolo de este sonido?" : "¿Cómo se lee este carácter?"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              <div className="flex flex-wrap justify-center gap-4">
                {options.map((option, index) => (
                  <Label
                    key={index}
                    htmlFor={`option-${index}`}
                    className={`cursor-pointer border rounded-lg px-6 text-gray-400 py-4 text-2xl font-medium hover:bg-indigo-100 transition-colors ${
                      selectedOption === option ? "bg-indigo-200 border-indigo-500" : "border-gray-300"
                    }`}
                    onClick={() => reproducirSonido(option)}
                  >
                    <input
                      type="radio"
                      id={`option-${index}`}
                      value={option}
                      checked={selectedOption === option}
                      onChange={() => setSelectedOption(option)}
                      className="hidden"
                    />
                    {modoInversoActual ? hiraganaMap[option] || option : option}
                  </Label>
                ))}
              </div>
            </RadioGroup>

            <div className="mt-6 flex flex-col items-center gap-2">
              <Button onClick={manejarRespuesta} size="lg">
                Verificar respuesta
              </Button>
              {result && <div className={`text-lg font-semibold ${resultColor}`}>{result}</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {showFeedback && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center text-white text-5xl font-bold transition-opacity duration-300 ${
            resultColor === "text-green-600" ? "bg-green-300/90 text-green-900" : "bg-red-300/90 text-red-900"
          }`}
        >
          {result}
        </div>
      )}
    </div>
  )
}
