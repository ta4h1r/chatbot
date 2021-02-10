pass="***"
containerName="qa-logs-handler"
networkName="custom0"
localPort=3003
containerPort=8003
imageName="qa-logs-handler"
tag="v2"

# Tagging to push image to a cloud registry
# $repo = "ta4h1r"
# docker tag $imageName:$tag $repo/$imageName:$tag
# docker push $repo/$imageName:$tag

echo $pass | sudo docker build -t $imageName:$tag .
echo $pass | sudo docker run -itd --name=$containerName --network=$networkName -p $localPort:$containerPort $imageName:$tag
