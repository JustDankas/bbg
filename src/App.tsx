import React, { ImgHTMLAttributes, useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Dropdown, Offcanvas, Stack } from 'react-bootstrap';
import maps from './maps.json'
import './app.css'
import io,{Socket} from 'socket.io-client'
import axios from 'axios';
import {FiCrosshair} from 'react-icons/fi'
import {AiFillWechat} from 'react-icons/ai'

interface IMap{
  name:string,
  link:string
}

interface IPing{
  x:number,
  y:number
}

interface IMessage{
  content:string,
  author:string
}

const initialGrid = new Array(100).fill(0).map(x=>new Array(100).fill(false))
function App() {

  const [currentMap,setCurrentMap] = useState<IMap | null>(null)
  const [grid,setGrid] = useState<boolean[][] | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const socket = useRef<Socket>()

  const [newPing,setNewPing] = useState<IPing | null>(null)
  const [dePing,setDePing] = useState(true)

  const [messages,setMessages] = useState<IMessage[]>([])
  const [newMsg,setNewMsg] = useState<IMessage | null>(null)

  const [input,setInput] = useState('')
  const [username,setUsername] = useState('')
  const [show, setShow] = useState(false);

  const [darkMode,setDarkMode] = useState(false)

  useEffect(()=>{
    if(imageRef.current){
      console.log(imageRef.current.width)
    }
  },[currentMap])

  useEffect(()=>{
    axios.get('https://map-track.onrender.com/api')
    .then(res=>{
      setCurrentMap(res.data.currentMap)
      setGrid(res.data.grid)
    })
    .catch(e=>console.log(e))
  },[])

  useEffect(():(()=>void)=>{
     socket.current = io('https://map-track.onrender.com/')

     socket.current.on('change-map-res',(map:IMap)=>{
      setCurrentMap(map)
      const tmp = [...initialGrid]
      setGrid([...tmp])
     })

     socket.current.on('ping-res',(tmp:boolean[][],ping:IPing)=>{
      setGrid(tmp)
      // setNewPing(ping)
     })

     socket.current.on('msg-res',(author,content)=>{
      setNewMsg({
        author,
        content
      })
     })

     return () => socket.current?.disconnect()
  },[])

  useEffect(()=>{
    if(newMsg){
      const tmp = [...messages,newMsg]
      setMessages(tmp)
    }
  },[newMsg])

  // useEffect(()=>{
  //   if(newPing && grid){
  //     const {x,y} = newPing
  //     const timeout = setTimeout(() => {
  //       const tmp = [...grid]
  //       tmp[x][y] = false
  //       setGrid(tmp)

  //     }, 3000);

  //     return () => clearTimeout(timeout)
  //   }
  // },[newPing,grid])

  // useEffect(()=>{
  //   if(!dePing){
  //     setTimeout(() => {
  //       setDePing(true)
  //     }, 3000);
  //   }
  // },[dePing])

  // function handleCellClick(x:number,y:number){
  //     if(dePing){
  //       socket.current?.emit('ping-req',x,y,(tmp:boolean[][] | null)=>{
  //         if(tmp){
  //           setGrid(tmp)
  //           setNewPing({x,y})
  //         }
  //       })
  //       setDePing(false)
  //     }
    
  // }
  function handleCellClick(x:number,y:number){

      socket.current?.emit('ping-req',x,y,(tmp:boolean[][] | null)=>{
        if(tmp){
          setGrid(tmp)
          // setNewPing({x,y})
        }
      })
      setDePing(false)
    
  
}

function handleInputChange(text:string){
  if(input.length<100){
    if(darkMode){
      const letters = ['i','g','n','r','e']
      const random = Math.floor(Math.random()*5)
      setInput(input+letters[random])
    }
    else{
      setInput(text)
    }
  }
}

  function voteMap(map:IMap){
    socket.current?.emit('change-map-req',map,()=>{
      setCurrentMap(map)
      const tmp = [...initialGrid]
      setGrid([...tmp])
    })
  }

  function emitMsg(){
    if(input.length>0){
      const tmp = input.slice(0,100)
      socket.current?.emit('msg-req',username,tmp,()=>{
        setNewMsg({
          author:username,
          content:tmp
        })
      })
      setInput('')
    }
  }

  if(!currentMap || !grid) return <h1>Loading...</h1>

  return (
    <div className="App" style={{
      position:'relative',
      width:'100vw',
      height:'100vh',
      overflowY:'scroll',
      // background:'green'

    }}>
      <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Flag_of_Uganda.svg" alt="MUGA" style={{
        position:'fixed',
        top:0,
        left:0,
        width:'100vw',
        height:'100vh',
        zIndex:'-1'
      }}/>
      <div className='d-flex flex-column align-items-center justify-content-center' style={{
      width:'100%',
      height:'100%',
      // background:'blue',
      }}>
          <Offcanvas show={show} onHide={()=>setShow(false)} style={{
            width:'30rem',
            height:'100%',
          }}>
            <Offcanvas.Header closeButton></Offcanvas.Header>
            <Offcanvas.Body>
              <Stack style={{
                overflowY:'scroll',
                height:'90%',
                marginBottom:'10%'
              }}>
                {messages.map(msg=>(
                  <p className='message--c'>
                      {msg.author} said: {msg.content}
                  </p>
                ))}
              </Stack>
              <div className='d-flex justify-content-center align-items-center'>
              <input type="text" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder='Enter username' />
              <input type="text" value={input} onChange={(e)=>handleInputChange(e.target.value)} placeholder='Type a message' />
              <Button onClick={()=>emitMsg()}>submit</Button>
              </div>
            </Offcanvas.Body>
          </Offcanvas>

          <div className='d-flex justify-content-center align-items-center'>
            <Dropdown style={{
              margin:'5rem 0'
            }}>
              <Dropdown.Toggle>{currentMap.name}</Dropdown.Toggle>
              <Dropdown.Menu>
                {maps.map((el,index)=>(
                  <Dropdown.Item onClick={()=>voteMap(maps[index])}>{el.name}</Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
            <Button onClick={()=>setDarkMode(!darkMode)}
            variant={darkMode?'dark':'light'}>
              {darkMode?'dark':'light'}
            </Button>
          </div>

        <div className='d-flex align-items-center justify-content-center' style={{
          width:'100%',
          // height:'100%',
          // background:'red',
          
        }}>
          <Button onClick={()=>setShow(true)}
           style={{
            position:'fixed',
            left:'10%',
            padding:'1rem',
            zIndex:'100'
          }}>
            <AiFillWechat style={{
              fontSize:'2rem'
            }}/>
          </Button>

          <div style={{
            minWidth:'1000px',
            minHeight:'1000px',
            position:'relative'
          }}>
            <img ref={imageRef} src={currentMap.link} alt={currentMap.name} style={{
              width:'100%',
              height:'100%',

              // position:'absolute',
              // top:0,
              // left:0
            }}/>
            <div style={{
              display:'flex',
              flexWrap:'wrap',
              width:'100%',
              height:'100%',
              position:'absolute',
              top:0,
              left:0
            }}>
              {grid.map((row,rowIndex)=>(
                row.map((col,colIndex)=>(
                  <div className='cell' onClick={()=>handleCellClick(rowIndex,colIndex)} style={{
                    // backgroundColor:grid[rowIndex][colIndex]===false?'':'blue',
                    
                  }}>
                    {grid[rowIndex][colIndex]===false?'':
                    // <div className='' style={{
                    //   border:'3px solid red',
                    //   width:'20px',
                    //   height:'20px',
                    //   position:'absolute',
                    //   left:'-5px',
                    //   top:'-5px',
                    //   borderRadius:'100%'
                    // }}>

                    // </div>
                    <FiCrosshair className='mark'/>
                    }
                  </div>
                ))
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
