FROM node:6.9.5

RUN set -e && apt-get update && apt-get install -y sendmail

WORKDIR /etc/mail
COPY ./sendmail.mc /etc/mail/sendmail.mc
RUN m4 sendmail.mc > sendmail.cf && \
 echo "Connect:172 RELAY" >> access && \
 echo "Connect:10 RELAY" >> access && \
 make

ADD ./package.json /app/package.json
WORKDIR /app

RUN npm install
ADD . /app

CMD /usr/lib/sendmail -bD -X /proc/self/fd/1 & npm start
