'use client'

import { Box, Button, Stack, TextField } from '@mui/material'
import { useState, useRef, useEffect, use } from 'react'
import { styled } from '@mui/styles'


const CustomTextField = styled(TextField)(({prefersColorScheme}) => ({
  TextField: {
    '& .MuiFilledInput-root': {
      backgroundColor: prefersColorScheme === 'dark' ? '#333' : '#fff',
      color: prefersColorScheme === 'dark' ? '#fff' : '#000',
      border: prefersColorScheme === 'dark' ? '1px solid #fff' : '1px solid #000',
    },
    '& .MuiInputLabel-root': {
      color: prefersColorScheme === 'dark' ? '#fff' : '#000',
    },
  },
}))

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm the Lumina AI medical assistant. How can I be of assistance?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [prefersColorScheme, setPrefersColorScheme]=useState('light');

  useEffect(() => {
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setPrefersColorScheme(colorScheme);
  }, []);
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true)

    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' }
    ])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      })

      if (!response.ok) {
        throw new Error('Network response was not okay.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            {
              ...lastMessage, content: lastMessage.content + text
            },
          ]
        })
      }
    }
    catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I am sorry, but I encountered an error. Please try again." }
      ])
    }
    setIsLoading(false)
  }

  // Allows user to send message by pressing enter
  const handleKeyPress = (event) => {
    if (event.key == 'Enter' && !event.shiftKey){
      event.preventDefault()
      sendMessage()
    }
  }

    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth"})
    }

    useEffect(() => {
      scrollToBottom()
    }, [messages])


  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid darkgray"
        border-radius="30px"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref = {messagesEndRef} />


        </Stack>
        <Stack direction={'row'} spacing={2}>
          <CustomTextField
            label="Message"
            fullWidth
            variant='filled'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            prefersColorScheme={prefersColorScheme}
          />
          <Button variant="contained" onClick={sendMessage} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>

  )
}
