"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  type: string;
  counter?: string;
  value?: number;
  message?: string;
}

interface CounterData {
  [key: string]: number;
}

export default function Home() {
  const [counters, setCounters] = useState<CounterData>({});
  const [isConnected, setIsConnected] = useState(false);
  const [newCounterName, setNewCounterName] = useState("");
  const [newCounterValue, setNewCounterValue] = useState(0);
  const [editingCounter, setEditingCounter] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ?? "wss://f47ea669bb4d.ngrok-free.app/ws";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);
        console.log("WebSocket message received:", message);

        if (
          message.type === "counter" &&
          message.counter &&
          message.value !== undefined
        ) {
          console.log(
            "Updating counter:",
            message.counter,
            "with value:",
            message.value
          );
          setCounters((prev) => ({
            ...prev,
            [message.counter!]: message.value!,
          }));
        } else if (message.type === "deleted" && message.counter) {
          console.log("Deleting counter:", message.counter);
          setCounters((prev) => {
            const newCounters = { ...prev };
            delete newCounters[message.counter!];
            return newCounters;
          });
        } else {
          console.log("Unhandled message type:", message.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    console.log("Counters state updated:", counters);
  }, [counters]);

  const sendMessage = (type: string, counter?: string, value?: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: Message = { type, counter, value };
      console.log("Sending WebSocket message:", message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.log(
        "WebSocket not connected. Current state:",
        wsRef.current?.readyState
      );
    }
  };

  const handleIncrement = (counterName: string) => {
    sendMessage("increment", counterName);
  };

  const handleDecrement = (counterName: string) => {
    sendMessage("decrement", counterName);
  };

  const handleSetValue = (counterName: string, value: number) => {
    sendMessage("set", counterName, value);
    setEditingCounter(null);
  };

  const handleCreateCounter = () => {
    if (newCounterName.trim()) {
      sendMessage("create", newCounterName, newCounterValue);
      setNewCounterName("");
      setNewCounterValue(0);
    }
  };

  const handleDeleteCounter = (counterName: string) => {
    if (
      confirm(`Are you sure you want to delete the counter "${counterName}"?`)
    ) {
      sendMessage("delete", counterName);
    }
  };

  const startEditing = (counterName: string, currentValue: number) => {
    setEditingCounter(counterName);
    setEditValue(currentValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateCounter();
    }
  };

  const counterNames = Object.keys(counters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Live Multi-Counter
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time updates across all devices with multiple counters
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6 text-center">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isConnected
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>

        {/* Create New Counter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create New Counter
          </h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Counter Name
              </label>
              <input
                type="text"
                value={newCounterName}
                onChange={(e) => setNewCounterName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter counter name"
                disabled={!isConnected}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Value
              </label>
              <input
                type="number"
                value={newCounterValue}
                onChange={(e) =>
                  setNewCounterValue(parseInt(e.target.value) || 0)
                }
                disabled={!isConnected}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>
            <button
              onClick={handleCreateCounter}
              disabled={!isConnected || !newCounterName.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Create
            </button>
          </div>
        </div>

        {/* Counters Grid */}
        {counterNames.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-lg">
              No counters yet. Create your first counter above!
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {counterNames.map((counterName) => (
              <div
                key={counterName}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                    {counterName}
                  </h3>
                  <button
                    onClick={() => handleDeleteCounter(counterName)}
                    disabled={!isConnected}
                    className="text-red-500 hover:text-red-700 disabled:text-gray-400 transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Counter Display */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-4 text-center">
                  <div className="text-4xl font-bold text-white mb-1">
                    {counters[counterName]}
                  </div>
                  <div className="text-blue-100 text-sm">Current Value</div>
                </div>

                {/* Control Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => handleIncrement(counterName)}
                    disabled={!isConnected}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    +
                  </button>

                  <button
                    onClick={() => handleDecrement(counterName)}
                    disabled={!isConnected}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                    -
                  </button>
                </div>

                {/* Set Value */}
                {editingCounter === counterName ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) =>
                        setEditValue(parseInt(e.target.value) || 0)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                    <button
                      onClick={() => handleSetValue(counterName, editValue)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                    >
                      Set
                    </button>
                    <button
                      onClick={() => setEditingCounter(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      startEditing(counterName, counters[counterName])
                    }
                    disabled={!isConnected}
                    className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                  >
                    Set Value
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Open this app on multiple devices to see real-time updates across
            all counters!
          </p>
        </div>
      </div>
    </div>
  );
}
