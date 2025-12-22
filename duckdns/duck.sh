#!/bin/bash
current=""
while true; do
	latest=`ec2-metadata --public-ipv4`
	echo "public-ipv4=$latest"
	if [ "$current" == "$latest" ]
	then
		echo "ip not changed"
	else
		echo "ip has changed - updating"
		current=$latest
		echo url="https://www.duckdns.org/update?domains=fr2ee-webchat&token=7eff00c9-ffa2-43a9-8708-160f5efd98ff&ip=" | curl -k -o ~/duckdns/duck.log -K -
	fi
	sleep 5m
done