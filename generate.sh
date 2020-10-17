#!/usr/bin/env bash

set -x

mkdir -p outputs

boardtypes=("I" "O" "T" "W" "X" "Y")

while true; do
  board=${boardtypes[$RANDOM % ${#boardtypes[@]}]}
  id=$(date +"%Y%m%d%H%M%S%3N")
  outputfile="outputs/board-$board-$id.txt"
  boardfile="boards/$board.txt"
  charsfile="chars-$id.json"
  cnffile="crossword-$id.cnf"
  resultfile="result-$id.cnf"

  npx ts-node index.ts --board $boardfile --dict dictionary.txt --output-chars $charsfile --output-cnf $cnffile
  timeout 5m ../cadical/build/cadical --sat $cnffile > $resultfile
  if [ $? != 124 ]; then
    npx ts-node collect.ts --board $boardfile --cnf $resultfile --chars $charsfile > $outputfile
  fi
  rm -f $charsfile $cnffile $resultfile
done
