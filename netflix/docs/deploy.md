## AWS Lightsail

### Lightsail Instance

```sh
# yum (Amazon Linux에서 사용하는 패키지 매니저)
# Git 설치
$ sudo yum install git -y

# ssh 키 생성
$ ssh-keygen
$ cat /home/ec2-user/.ssh/id_rsa.pub

# Node.js 설치
$ sudo yum install nodejs -y

# pnpm 설치
$ sudo npm i -g pnpm

# PM2 설치
$ sudo npm i -g pm2

# build
$ pnpm build

# PM2 Background Process
$ pm2 start dist/main.js --name [이름]
$ pm2 log
$ pm2 monit
```

### Nginx

-   Proxy 설정
    -   80번 포트로 오는 요청들을 전부 3000번 포트로 포트 포워딩

```sh
# Nginx 설치
$ sudo yum install nginx -y
# Nginx 설정 파일 생성
$ sudo vim /etc/nginx/conf.d/nestjs.conf
```

-   설정 파일
    -   `listen 80`; Nginx 서버 80번 포트에서 실행
    -   `location /`; 어떤 위치로 요청이 왔을 때 어디로 포트 포워딩 할지 블록{}으로 정리
        -   `proxy_pass`; 어디로 전달해줄지 작성

```text
server {
    listen 80;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```sh
# Nginx 실행
$ sudo systemctl start nginx
```

<br />

## Amazon Elastic Beanstalk

### IAM Role

-   Elastic Beanstalk에서 EC2 서버를 생성할 때 필요한 권한 생성
    -   Elastic Beanstalk 생성시 Configure service access 부분에서 사용
-   Select trusted entity
    -   Trusted entity type
        -   `AWS service`
    -   Use case
        -   `EC2`
-   Add permissions
    -   `AWSElasticBeanstalkMulticontainerDocker`
    -   `AWSElasticBeanstalkWebTier`
    -   `AWSElasticBeanstalkWorkerTier`

### Create Elastic Beanstalk new environment

-   Configure service access (서비스 액세스 구성)
    -   `Create and use new service role`
    -   EC2 instance profile
        -   생성해 놓은 Elastic Beanstalk용 IAM role 선택

### Procfile

-   실행 커맨드를 변경하고 싶을 경우 Procfile 작성 필요
-   루트 디렉토리에서 Procfile 파일 생성
-   Elastic Beanstalk에서 Node.js 환경으로 실행
    -   일반적으로 Node.js에서는 node app.js를 실행하도록 설정되어 있다
    -   `web:` 뒤에 오는 커맨드를 실행해서 Elastic Beanstalk에서 서비스를 실행시키기 위한 목적으로 작성

```text
web: npm run start:prod
```

<br />

## CI/CD

### GitHub Actions

-   GitHub에서 AWS로 접근할 수 있는 권한 생성
    -   IAM 권한 설정
        -   ElasticBeanstalk 배포시: `AdministratorAccess-AWSElasticBeanstalk`
        -   S3 권한: `AmazonS3FullAccess`
-   GitHub Actions 실행 파일 작성
    -   루트 디렉토리에서 `.github/workflows` 디렉토리 생성
    -   해당 디렉토리 내 `deploy.yml` 파일 생성 (네이밍 컨밴션 존재 X)

<br />

## Troubleshooting

-   Error: listen EADDRINUSE: address already in use :::3000

```sh
$ kill -9 $(lsof -t -i:3000 -sTCP:LISTEN)
```
