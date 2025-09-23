import React, { useState, useEffect, useRef } from 'react';
import Client from '../components/client';
import Editor from '../components/Editor';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import { initSocket } from '../socket';


const EditorPage = () => {

    const socketRef = useRef(null);
    const codeRef = useRef('');
    const [socketReady, setSocketReady] = useState(false);
    const location = useLocation();
    const {roomId} = useParams();
    const reactnavigate = useNavigate();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const init = async () =>{
            socketRef.current = await initSocket();
            const handleErrors = (e) => {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactnavigate('/');
            };
            socketRef.current.on('connect_error', handleErrors);
            socketRef.current.on('connect_failed', handleErrors);



            socketRef.current.emit(ACTIONS.JOIN,{
                roomId,
                username : location.state?.username, 
            });

            //listen for joined event
            socketRef.current.on(ACTIONS.JOINED, ({clients, username, socketId}) => {
                if(username !== location.state?.username){
                    toast.success(`${username} joined the room`);
                }
                setClients(clients);
                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    code : codeRef.current,
                    socketId,
                });                // console.log(`${username} joined`);
            })   ;

            //listen for disconnected
            socketRef.current.on(ACTIONS.DISCONNECTED, ({socketId,username}) => {

                toast.success(`${username} left the room`);
                setClients((prev) => {
                    return prev.filter( (client) => client.socketId !== socketId);
                });
                // console.log(`${username} left`);
            })

            setSocketReady(true);

        };
        init();
        // cleanup listeners
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
            }
        }
    },[]);

    const [clients, setClients] = useState([]);

    async function copyroomId(){
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } 
        catch(err){
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveroom(){
        reactnavigate('/')
    }

    if(!location.state){

        return <Navigate to="/" />
    }
    return (
        <div className='mainWrap'>
        
        <div className='aside'>
            <div className='asideInner'>
                <div className='logo'>
                    <img className='logoImage' src='/logo192.png' alt='code-sync-logo'/>
                </div>

                <h3>Connected</h3>

                <div className='clientsList'>
                    {
                        clients.map((client) => (
                            <Client key={client.socketId} username={client.username}/>    
                        ))
                    }
                </div>

            </div>
            <button className='btn copyBtn' onClick={copyroomId}>COPY ROOM ID</button>
            <button className='btn leaveBtn' onClick={leaveroom}>Leave</button>
        </div>
        <div className='editorWrap'>
            {socketReady && (
                <Editor socketRef={socketRef} roomId={roomId} onCodeChange={({ code }) => { codeRef.current = code; }} />
            )}
        </div>
        </div>
    );
}

export default EditorPage;