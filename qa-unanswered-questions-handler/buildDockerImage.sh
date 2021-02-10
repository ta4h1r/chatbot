pass="***"
containerName="qa-unanswered-questions-handler"
networkName="custom0"
localPort=3001
containerPort=8001
imageName="qa-unanswered-questions-handler"
tag="v2"

# Tagging to push image to a cloud registry
# $repo = "ta4h1r"
# docker tag $imageName:$tag $repo/$imageName:$tag
# docker push $repo/$imageName:$tag

echo $pass | sudo docker build -t $imageName:$tag .
echo $pass | sudo docker run -itd --name=$containerName --network=$networkName --restart unless-stopped -p $localPort:$containerPort $imageName:$tag
