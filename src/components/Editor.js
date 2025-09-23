import React, { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);

    // initialize CodeMirror once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        editorRef.current = CodeMirror.fromTextArea(
            document.getElementById('realtimeEditor'),
            {
                mode: { name: 'javascript', json: true },
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
                readOnly: false,
            }
        );

        // Ensure editor starts at the top and cursor at beginning
        try {
            editorRef.current.setCursor({ line: 0, ch: 0 });
            editorRef.current.scrollTo(null, 0);
            editorRef.current.focus();
        } catch (e) {}

        const handleChange = (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();
            onCodeChange({ code });
            if (origin !== 'setValue' && socketRef?.current) {
                // console.log('EMIT CODE_CHANGE', { roomId, len: code?.length });
                socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                    roomId,
                    code,
                });
            }
        };
        editorRef.current.on('change', handleChange);

        return () => {
            if (editorRef.current) {
                editorRef.current.off('change', handleChange);
                // convert back to textarea and remove editor
                try { editorRef.current.toTextArea(); } catch (e) {}
            }
        };
    }, []);

    useEffect(() => {
        if (!socketRef?.current) return;
        const currentSocket = socketRef.current;
        const handler = ({ code }) => {
            // console.log('RECV CODE_CHANGE', { len: code?.length });
            if (code !== null && editorRef.current) {
                editorRef.current.setValue(code);
                // keep viewport near the top on first sync
                try { editorRef.current.scrollTo(null, 0); } catch (e) {}
            }
        };
        currentSocket.on(ACTIONS.CODE_CHANGE, handler);
        return () => {
            currentSocket.off(ACTIONS.CODE_CHANGE, handler);
        };
    }, [socketRef]);

    return <textarea id="realtimeEditor" cols="30" rows="10"></textarea>;
};

export default Editor;