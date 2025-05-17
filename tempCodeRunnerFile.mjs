const groot = new Groot();
    await groot.add('sample.txt');
    await groot.add('vcs.py')
    await groot.commit('Second commit');