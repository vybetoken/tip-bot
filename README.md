# Vybe Telegram TipBot 

Light weight off-chain tipbot for the Vybe token

## Bot Setup
```
git clone 
npm install 

```
- Fill in the following :
    - bot (token)
    - admin IDs (not needed but allow you to use /halt etc)
    - generate eth addrss and fill in address and seed
    - create infura account and enter infura key
    
```
node tipbot.js
```
## Bot Usage on telegram
- register adds username and ID to local dB:
```
    /register
```
- deposit, Set external address you will deposit funds from
    Bot will respond with an address you will send funds to and await a deposit
```
    /deposit 0x2.....
```

- send tips either in vybe or usd:
```
    /tip amount @user
```
- report price in usd and eth:
```
    /price
```
- withdraw to external wallets:
```
    /withdraw {AMOUNT} 0x2....
```

